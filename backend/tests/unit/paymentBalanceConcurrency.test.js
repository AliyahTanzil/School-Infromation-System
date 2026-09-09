import test from 'node:test';
import assert from 'node:assert/strict';
const db = { $on() {}, payment: { findUnique: async () => null } };
globalThis.__prisma = db;
const { recordPayment } = await import('../../src/application/services/financeService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const input = {
  invoiceId: 'invoice',
  amount: 60,
  provider: 'manual',
  reference: 'REF',
  idempotencyKey: 'key',
};

test('a stale invoice balance conflicts before payment or ledger persistence', async () => {
  db.$transaction = async (work) =>
    work({
      invoice: {
        findFirst: async () => ({ id: 'invoice', balance: 100, total: 100 }),
        updateMany: async ({ where }) => {
          assert.deepEqual(where, { id: 'invoice', ...scope, balance: 100 });
          return { count: 0 };
        },
      },
      payment: { create: async () => assert.fail('must not create payment') },
      financialTransaction: { create: async () => assert.fail('must not create ledger entry') },
    });
  await assert.rejects(recordPayment(scope, input), { name: 'ConflictError' });
});

test('two simulated payments reading the same balance cannot both claim it', async () => {
  let currentBalance = 100;
  let readers = 0;
  let release;
  const bothRead = new Promise((resolve) => {
    release = resolve;
  });
  let payments = 0;
  db.$transaction = async (work) =>
    work({
      invoice: {
        findFirst: async () => {
          readers += 1;
          if (readers === 2) release();
          await bothRead;
          return { id: 'invoice', studentId: 'student', balance: 100, total: 100 };
        },
        updateMany: async ({ where, data }) => {
          if (where.balance !== currentBalance) return { count: 0 };
          currentBalance = data.balance;
          return { count: 1 };
        },
      },
      payment: {
        create: async () => {
          payments += 1;
          return { id: 'payment' };
        },
      },
      financialTransaction: { create: async () => ({}) },
    });
  const outcomes = await Promise.allSettled([
    recordPayment(scope, input),
    recordPayment(scope, { ...input, idempotencyKey: 'key-2' }),
  ]);
  assert.equal(outcomes.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find((item) => item.status === 'rejected').reason.name, 'ConflictError');
  assert.equal(currentBalance, 40);
  assert.equal(payments, 1);
});

test('payment and ledger failures roll back the staged balance in the transaction harness', async () => {
  for (const failAt of ['payment', 'ledger']) {
    let committedBalance = 100;
    db.$transaction = async (work) => {
      let stagedBalance = committedBalance;
      const result = await work({
        invoice: {
          findFirst: async () => ({
            id: 'invoice',
            studentId: 'student',
            balance: 100,
            total: 100,
          }),
          updateMany: async ({ data }) => {
            stagedBalance = data.balance;
            return { count: 1 };
          },
        },
        payment: {
          create: async () => {
            if (failAt === 'payment') throw new Error('payment failed');
            return { id: 'payment' };
          },
        },
        financialTransaction: {
          create: async () => {
            throw new Error('ledger failed');
          },
        },
      });
      committedBalance = stagedBalance;
      return result;
    };
    await assert.rejects(recordPayment(scope, input), /failed/);
    assert.equal(committedBalance, 100);
  }
});
