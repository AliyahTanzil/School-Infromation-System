import prisma from '../../infrastructure/orm/prismaClient.js';
import { calculateInvoice, nextInvoiceStatus } from '../../domain/financeCalculations.js';

export async function listInvoices({ schoolId, studentId, status }) {
  return prisma.invoice.findMany({
    where: { schoolId, ...(studentId ? { studentId } : {}), ...(status ? { status } : {}) },
    include: { student: { include: { profile: true } }, payments: true, fee: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createInvoice({
  tenantId,
  schoolId,
  studentId,
  feeId,
  invoiceNumber,
  subtotal,
  discount = 0,
  dueAt,
}) {
  const amounts = calculateInvoice({ subtotal, discount });
  return prisma.invoice.create({
    data: {
      tenantId,
      schoolId,
      studentId,
      feeId,
      invoiceNumber,
      dueAt,
      ...amounts,
      status: 'ISSUED',
      issuedAt: new Date(),
    },
  });
}

export async function getPayment({ paymentId, tenantId, schoolId }) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId, schoolId },
    include: { invoice: true },
  });
  if (!payment) throw new Error('Payment not found');
  return payment;
}

export async function recordPayment({
  tenantId,
  schoolId,
  invoiceId,
  amount,
  provider = 'manual',
  reference,
  idempotencyKey,
}) {
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (
      existing.tenantId !== tenantId ||
      existing.schoolId !== schoolId ||
      existing.invoiceId !== invoiceId
    ) {
      throw new Error('Payment idempotency key is already used for another transaction');
    }
    return existing;
  }
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, tenantId, schoolId } });
    if (!invoice) throw new Error('Invoice not found');
    if (Number(amount) > Number(invoice.balance))
      throw new Error('Payment exceeds the outstanding invoice balance');
    const payment = await tx.payment.create({
      data: {
        tenantId,
        schoolId,
        invoiceId,
        amount,
        provider,
        reference,
        idempotencyKey,
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });
    const balance = Math.max(0, Number(invoice.balance) - Number(amount));
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { balance, status: nextInvoiceStatus(balance, Number(invoice.total)) },
    });
    return payment;
  });
}

export default { listInvoices, createInvoice, getPayment, recordPayment };
