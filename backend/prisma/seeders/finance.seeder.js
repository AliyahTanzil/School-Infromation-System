import { Prisma } from '@prisma/client';

export async function seedFinance(prisma) {
  const school = await prisma.school.findFirst({ where: { deletedAt: null } });
  const student = await prisma.student.findFirst({
    where: { schoolId: school?.id, deletedAt: null },
  });
  if (!school || !student) return;

  const category = await prisma.feeCategory.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'TUITION' } },
    update: { name: 'Tuition', active: true },
    create: { tenantId: school.tenantId, schoolId: school.id, code: 'TUITION', name: 'Tuition' },
  });
  const fee = await prisma.feeStructure.upsert({
    where: { id: '00000000-0000-0000-0000-000000000017' },
    update: { amount: new Prisma.Decimal('1200.00'), active: true },
    create: {
      id: '00000000-0000-0000-0000-000000000017',
      tenantId: school.tenantId,
      schoolId: school.id,
      name: 'Term 1 Tuition',
      description: 'Deterministic Module 17 fixture',
      amount: new Prisma.Decimal('1200.00'),
      academicYear: '2026/27',
      feeCategoryId: category.id,
    },
  });
  const invoice = await prisma.invoice.upsert({
    where: { schoolId_invoiceNumber: { schoolId: school.id, invoiceNumber: 'INV-DEMO-017' } },
    update: {
      total: new Prisma.Decimal('1200.00'),
      balance: new Prisma.Decimal('700.00'),
      status: 'PARTIALLY_PAID',
    },
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      studentId: student.id,
      feeId: fee.id,
      invoiceNumber: 'INV-DEMO-017',
      subtotal: new Prisma.Decimal('1200.00'),
      total: new Prisma.Decimal('1200.00'),
      balance: new Prisma.Decimal('700.00'),
      status: 'PARTIALLY_PAID',
      dueAt: new Date('2026-10-15'),
      issuedAt: new Date('2026-09-01'),
    },
  });
  const payment = await prisma.payment.upsert({
    where: { idempotencyKey: 'SEED-PAY-017' },
    update: {
      amount: new Prisma.Decimal('500.00'),
      status: 'SUCCEEDED',
      paidAt: new Date('2026-09-10'),
    },
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      invoiceId: invoice.id,
      amount: new Prisma.Decimal('500.00'),
      provider: 'seed',
      reference: 'SEED-REC-017',
      idempotencyKey: 'SEED-PAY-017',
      status: 'SUCCEEDED',
      paidAt: new Date('2026-09-10'),
    },
  });
  await prisma.financialTransaction.upsert({
    where: { schoolId_reference: { schoolId: school.id, reference: 'SEED-TXN-017' } },
    update: { amountMinor: 50000, paymentId: payment.id, invoiceId: invoice.id },
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      studentId: student.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      type: 'PAYMENT',
      amountMinor: 50000,
      reference: 'SEED-TXN-017',
      metadata: { source: 'module-17-seed' },
    },
  });
}

export default seedFinance;
