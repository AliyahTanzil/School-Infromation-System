import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  calculateInvoice,
  nextInvoiceStatus,
  paymentMinorUnits,
} from '../../domain/financeCalculations.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

const scopeWhere = (scope) => {
  if (!scope?.tenantId || !scope?.schoolId)
    throw new AuthorizationError('Finance school context is required', 'SCHOOL_CONTEXT_REQUIRED');
  return { tenantId: scope.tenantId, schoolId: scope.schoolId };
};
async function hydrateInvoice(invoice, db = prisma) {
  const [student, fee, payments] = await Promise.all([
    db.student.findFirst({ where: { id: invoice.studentId, tenantId: invoice.tenantId } }),
    invoice.feeId
      ? db.fee.findFirst({ where: { id: invoice.feeId, ...scopeWhere(invoice) } })
      : null,
    db.payment.findMany({
      where: { invoiceId: invoice.id, ...scopeWhere(invoice) },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { ...invoice, student, fee, payments };
}
export async function listInvoices(scope, { studentId, status } = {}) {
  const rows = await prisma.invoice.findMany({
    where: {
      ...scopeWhere(scope),
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(rows.map((row) => hydrateInvoice(row)));
}
export async function summary(scope) {
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({ where: scopeWhere(scope), select: { total: true, balance: true } }),
    prisma.payment.findMany({
      where: { ...scopeWhere(scope), status: 'SUCCEEDED' },
      select: { amount: true },
    }),
  ]);
  const issuedMinor = invoices.reduce((sum, item) => sum + Math.round(Number(item.total) * 100), 0);
  const collectedMinor = payments.reduce(
    (sum, item) => sum + Math.round(Number(item.amount) * 100),
    0
  );
  return {
    invoiceCount: invoices.length,
    issuedMinor,
    outstandingMinor: invoices.reduce(
      (sum, item) => sum + Math.round(Number(item.balance) * 100),
      0
    ),
    collectedMinor,
    collectionRate: issuedMinor ? Math.round((collectedMinor / issuedMinor) * 100) : 0,
  };
}
export async function listTransactions(scope, limit = 50) {
  return prisma.financialTransaction.findMany({
    where: scopeWhere(scope),
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 50, 100),
  });
}
export async function createInvoice(scope, data) {
  const { tenantId, schoolId } = scopeWhere(scope);
  const amounts = calculateInvoice(data);
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findFirst({ where: { id: data.studentId, tenantId } });
    if (!student) throw new NotFoundError('Student not found');
    if (data.feeId) {
      const fee = await tx.fee.findFirst({
        where: { id: data.feeId, tenantId, schoolId, active: true },
      });
      if (!fee) throw new ValidationError('Fee is outside the selected school or inactive');
    }
    return tx.invoice.create({
      data: { ...data, tenantId, schoolId, ...amounts, status: 'ISSUED', issuedAt: new Date() },
    });
  });
}
export async function getPayment(paymentId, scope) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ...scopeWhere(scope) },
  });
  if (!payment) throw new NotFoundError('Payment not found');
  const invoice = await prisma.invoice.findFirst({
    where: { id: payment.invoiceId, ...scopeWhere(scope) },
  });
  return { ...payment, invoice };
}
function matchingPayment(existing, scope, data) {
  if (
    existing.tenantId !== scope.tenantId ||
    existing.schoolId !== scope.schoolId ||
    existing.invoiceId !== data.invoiceId ||
    Number(existing.amount) !== Number(data.amount) ||
    existing.provider !== data.provider ||
    existing.reference !== data.reference
  )
    throw new ConflictError('Payment idempotency key is already used for another transaction');
  return existing;
}

export async function recordPayment(scope, data) {
  const ownership = scopeWhere(scope);
  const amountMinor = paymentMinorUnits(data.amount);
  const lookup = () =>
    prisma.payment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
  const existing = await lookup();
  if (existing) return matchingPayment(existing, ownership, data);
  try {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, ...scopeWhere(scope) },
      });
      if (!invoice) throw new NotFoundError('Invoice not found');
      if (Number(data.amount) > Number(invoice.balance))
        throw new ValidationError('Payment exceeds the outstanding invoice balance');
      const balance = Math.max(0, Math.round(Number(invoice.balance) * 100) - amountMinor) / 100;
      const updated = await tx.invoice.updateMany({
        where: { id: invoice.id, ...ownership, balance: invoice.balance },
        data: { balance, status: nextInvoiceStatus(balance, Number(invoice.total)) },
      });
      if (updated.count !== 1)
        throw new ConflictError(
          'Invoice balance changed; retry the payment with the same idempotency key'
        );
      const payment = await tx.payment.create({
        data: { ...data, ...ownership, status: 'SUCCEEDED', paidAt: new Date() },
      });
      await tx.financialTransaction.create({
        data: {
          ...ownership,
          studentId: invoice.studentId,
          invoiceId: invoice.id,
          paymentId: payment.id,
          type: 'PAYMENT',
          amountMinor,
          reference: `PAY-${payment.id}`,
          metadata: { provider: data.provider, reference: data.reference },
        },
      });
      return payment;
    });
  } catch (error) {
    // The failed transaction has rolled back before checking a competing commit.
    if (
      error instanceof ConflictError ||
      error instanceof ValidationError ||
      error.code === 'P2002' ||
      error.code === 'P2034'
    ) {
      const committed = await lookup();
      if (committed) return matchingPayment(committed, ownership, data);
    }
    throw error;
  }
}
export default {
  listInvoices,
  summary,
  listTransactions,
  createInvoice,
  getPayment,
  recordPayment,
};
