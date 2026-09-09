import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { recordPayment } = await import('../../src/application/services/financeService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const input = {
  invoiceId: 'invoice',
  amount: 20,
  provider: 'manual',
  reference: 'receipt',
  idempotencyKey: 'payment-key',
};
const existing = {
  id: 'payment',
  ...scope,
  ...input,
  amount: { toString: () => '20.00' },
  status: 'SUCCEEDED',
};

test('identical payment retry returns the persisted payment without additional writes', async () => {
  db.payment = {
    findUnique: async ({ where }) => {
      assert.deepEqual(where, { idempotencyKey: 'payment-key' });
      return existing;
    },
  };
  db.$transaction = async () => assert.fail('a retry must not write');
  assert.equal(await recordPayment(scope, input), existing);
});

test('payment retry accepts equivalent decimal representations', async () => {
  db.payment = { findUnique: async () => existing };
  db.$transaction = async () => assert.fail('a retry must not write');
  assert.equal(await recordPayment(scope, { ...input, amount: '20.00' }), existing);
});

test('changed amount, provider or reference conflicts without financial writes', async () => {
  db.payment = { findUnique: async () => existing };
  db.$transaction = async () => assert.fail('a conflicting retry must not write');
  for (const change of [
    { amount: 21 },
    { amount: 20.01 },
    { provider: 'bank' },
    { reference: 'different-receipt' },
  ]) {
    await assert.rejects(recordPayment(scope, { ...input, ...change }), { name: 'ConflictError' });
  }
});

test('payment retry preserves tenant, school and invoice isolation', async () => {
  db.payment = { findUnique: async () => existing };
  db.$transaction = async () => assert.fail('a foreign retry must not write');
  for (const foreignScope of [
    { ...scope, tenantId: 'foreign' },
    { ...scope, schoolId: 'foreign' },
  ]) {
    await assert.rejects(recordPayment(foreignScope, input), { name: 'ConflictError' });
  }
  await assert.rejects(recordPayment(scope, { ...input, invoiceId: 'foreign' }), {
    name: 'ConflictError',
  });
});
