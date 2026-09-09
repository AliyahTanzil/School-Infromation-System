import test from 'node:test';
import assert from 'node:assert/strict';
import ConflictError from '../../src/shared/errors/ConflictError.js';
import ValidationError from '../../src/shared/errors/ValidationError.js';
const db = { $on() {} };
globalThis.__prisma = db;
const { recordPayment } = await import('../../src/application/services/financeService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const input = {
  invoiceId: 'invoice',
  amount: 20,
  provider: 'manual',
  reference: 'REF',
  idempotencyKey: 'key',
};
const payment = { id: 'payment', ...scope, ...input, status: 'SUCCEEDED' };

test('competing committed payment is returned only after the failed transaction exits', async () => {
  for (const error of [
    new ConflictError('stale balance'),
    new ValidationError('balance too low'),
    Object.assign(new Error('duplicate'), { code: 'P2002' }),
    Object.assign(new Error('serialization'), { code: 'P2034' }),
  ]) {
    let lookups = 0;
    let transactionExited = false;
    db.payment = {
      findUnique: async () => {
        lookups += 1;
        if (lookups === 1) return null;
        assert.equal(transactionExited, true);
        return payment;
      },
    };
    db.$transaction = async () => {
      transactionExited = true;
      throw error;
    };
    assert.equal(await recordPayment(scope, input), payment);
    assert.equal(lookups, 2);
  }
});

test('race recovery rejects a committed payment with changed ownership or payload', async () => {
  for (const change of [
    { tenantId: 'foreign' },
    { schoolId: 'foreign' },
    { invoiceId: 'foreign' },
    { amount: 21 },
    { provider: 'bank' },
    { reference: 'other' },
  ]) {
    let lookups = 0;
    db.payment = { findUnique: async () => (++lookups === 1 ? null : { ...payment, ...change }) };
    db.$transaction = async () => {
      throw Object.assign(new Error('duplicate'), { code: 'P2002' });
    };
    await assert.rejects(recordPayment(scope, input), { name: 'ConflictError' });
  }
});

test('race errors remain errors when no competing payment committed', async () => {
  const error = new ConflictError('stale balance');
  db.payment = { findUnique: async () => null };
  db.$transaction = async () => {
    throw error;
  };
  await assert.rejects(recordPayment(scope, input), (actual) => actual === error);
});

test('unrelated persistence errors are propagated without recovery lookup', async () => {
  let lookups = 0;
  db.payment = {
    findUnique: async () => {
      lookups += 1;
      return null;
    },
  };
  const error = new Error('database connection failed');
  db.$transaction = async () => {
    throw error;
  };
  await assert.rejects(recordPayment(scope, input), (actual) => actual === error);
  assert.equal(lookups, 1);
});
