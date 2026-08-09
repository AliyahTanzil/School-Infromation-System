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
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, schoolId } });
    if (!invoice) throw new Error('Invoice not found');
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

export default { listInvoices, createInvoice, recordPayment };
