import prisma from '../../infrastructure/orm/prismaClient.js';

const balanceFor = (invoice) => Math.max(0, invoice.totalMinor - invoice.discountMinor - invoice.scholarshipMinor - invoice.waiverMinor + invoice.adjustmentMinor - invoice.allocatedMinor);

export async function financialSummary({ schoolId }) {
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({ where: { schoolId }, select: { total: true, balance: true, status: true } }),
    prisma.payment.findMany({ where: { schoolId, status: 'SUCCEEDED' }, select: { amount: true } }),
  ]);
  return {
    invoiceCount: invoices.length,
    issuedMinor: invoices.reduce((sum, item) => sum + Math.round(Number(item.total) * 100), 0),
    outstandingMinor: invoices.reduce((sum, item) => sum + Math.round(Number(item.balance) * 100), 0),
    collectedMinor: payments.reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0),
  };
}

export async function listFinancialTransactions({ schoolId, limit = 50 }) {
  return prisma.financialTransaction.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 50, 100),
  });
}

export async function recordPaymentEvent({ tenantId, schoolId, studentId, invoiceId, amountMinor, reference, method = 'CASH' }) {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error('amountMinor must be a positive integer');
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        tenantId,
        schoolId,
        invoiceId,
        amount: amountMinor / 100,
        provider: method.toLowerCase(),
        reference,
        idempotencyKey: reference,
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });
    const event = await tx.financialTransaction.create({
      data: {
        tenantId,
        schoolId,
        studentId,
        invoiceId,
        paymentId: payment.id,
        type: 'PAYMENT',
        amountMinor,
        reference: `PAY-${reference}`,
        metadata: { method },
      },
    });
    return { payment, event };
  });
}

export default { financialSummary, listFinancialTransactions, recordPaymentEvent };
