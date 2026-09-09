import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentMinorUnits, MAX_PAYMENT_AMOUNT } from '../../src/domain/financeCalculations.js';
import { paymentSchema } from '../../src/application/validators/financeValidators.js';
const db = {
  $on() {},
  payment: { findUnique: async () => assert.fail('invalid input must not reach persistence') },
};
globalThis.__prisma = db;
const { recordPayment } = await import('../../src/application/services/financeService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const body = {
  invoiceId: '00000000-0000-4000-8000-000000000001',
  amount: 1,
  provider: 'manual',
  reference: 'REF',
  idempotencyKey: 'payment-key',
};

test('payment amount accepts cents and the exact ledger integer boundary', () => {
  for (const [amount, minor] of [
    [0.01, 1],
    [0.29, 29],
    [1.23, 123],
    ['20.00', 2000],
    [MAX_PAYMENT_AMOUNT, 2147483647],
  ]) {
    assert.equal(paymentMinorUnits(amount), minor);
    assert.equal(paymentSchema.safeParse({ body: { ...body, amount } }).success, true);
  }
});

test('payment validation rejects fractions of a cent, overflow and nonpositive amounts before lookup', async () => {
  for (const amount of [0, -1, 0.001, 1.234, 21474836.48, Infinity, NaN, 'invalid']) {
    assert.equal(paymentSchema.safeParse({ body: { ...body, amount } }).success, false);
    await assert.rejects(recordPayment(scope, { ...body, amount }), /Payment amount must/);
  }
});

test('payment subtraction uses minor units without floating-point balance residue', async () => {
  db.payment.findUnique = async () => null;
  db.$transaction = async (work) =>
    work({
      invoice: {
        findFirst: async () => ({
          id: body.invoiceId,
          balance: '0.30',
          total: '0.30',
          studentId: 'student',
        }),
        updateMany: async ({ data }) => {
          assert.equal(data.balance, 0.2);
          assert.equal(data.status, 'PARTIALLY_PAID');
          return { count: 1 };
        },
      },
      payment: { create: async () => ({ id: 'payment' }) },
      financialTransaction: {
        create: async ({ data }) => {
          assert.equal(data.amountMinor, 10);
        },
      },
    });
  await recordPayment(scope, { ...body, amount: 0.1 });
});
