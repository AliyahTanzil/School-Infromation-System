import prisma from '../../infrastructure/orm/prismaClient.js';
import { calculateInvoice, nextInvoiceStatus } from '../../domain/financeCalculations.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const scopeWhere = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
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
  const { tenantId, schoolId } = scope;
  const student = await prisma.student.findFirst({ where: { id: data.studentId, tenantId } });
  if (!student) throw new NotFoundError('Student not found');
  if (data.feeId) {
    const fee = await prisma.fee.findFirst({
      where: { id: data.feeId, tenantId, schoolId, active: true },
    });
    if (!fee) throw new ValidationError('Fee is outside the selected school or inactive');
  }
  const amounts = calculateInvoice(data);
  return prisma.invoice.create({
    data: { ...data, ...scope, ...amounts, status: 'ISSUED', issuedAt: new Date() },
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
export async function recordPayment(scope, data) {
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (existing) {
    if (
      existing.tenantId !== scope.tenantId ||
      existing.schoolId !== scope.schoolId ||
      existing.invoiceId !== data.invoiceId
    )
      throw new ConflictError('Payment idempotency key is already used for another transaction');
    return existing;
  }
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: data.invoiceId, ...scopeWhere(scope) },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (Number(data.amount) > Number(invoice.balance))
      throw new ValidationError('Payment exceeds the outstanding invoice balance');
    const payment = await tx.payment.create({
      data: { ...data, ...scope, status: 'SUCCEEDED', paidAt: new Date() },
    });
    const balance = Math.max(0, Number(invoice.balance) - Number(data.amount));
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { balance, status: nextInvoiceStatus(balance, Number(invoice.total)) },
    });
    await tx.financialTransaction.create({
      data: {
        ...scope,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        type: 'PAYMENT',
        amountMinor: Math.round(Number(data.amount) * 100),
        reference: `PAY-${payment.id}`,
        metadata: { provider: data.provider, reference: data.reference },
      },
    });
    return payment;
  });
}
export default {
  listInvoices,
  summary,
  listTransactions,
  createInvoice,
  getPayment,
  recordPayment,
};
