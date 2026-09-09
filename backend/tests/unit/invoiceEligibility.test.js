import test from 'node:test';
import assert from 'node:assert/strict';
const fail = () => assert.fail('must not use root persistence');
const db = {
  $on() {},
  student: { findFirst: fail },
  fee: { findFirst: fail },
  invoice: { create: fail },
};
globalThis.__prisma = db;
const { createInvoice } = await import('../../src/application/services/financeService.js');
const scope = { tenantId: 'tenant', schoolId: 'school', userId: 'actor' };
const input = {
  studentId: 'student',
  feeId: 'fee',
  invoiceNumber: 'INV-1',
  subtotal: 100,
  discount: 10,
};

test('invoice eligibility and creation use the same transaction client', async () => {
  const calls = [];
  db.$transaction = async (work) =>
    work({
      student: {
        findFirst: async ({ where }) => {
          calls.push('student');
          assert.deepEqual(where, { id: 'student', tenantId: 'tenant' });
          return { id: 'student' };
        },
      },
      fee: {
        findFirst: async ({ where }) => {
          calls.push('fee');
          assert.deepEqual(where, {
            id: 'fee',
            tenantId: 'tenant',
            schoolId: 'school',
            active: true,
          });
          return { id: 'fee' };
        },
      },
      invoice: {
        create: async ({ data }) => {
          calls.push('invoice');
          assert.equal(data.total, 90);
          assert.equal(data.balance, 90);
          assert.equal('userId' in data, false);
          return data;
        },
      },
    });
  await createInvoice(scope, input);
  assert.deepEqual(calls, ['student', 'fee', 'invoice']);
});

test('missing tenant student or ineligible school fee prevents invoice creation', async () => {
  for (const studentExists of [false, true]) {
    db.$transaction = async (work) =>
      work({
        student: { findFirst: async () => (studentExists ? { id: 'student' } : null) },
        fee: {
          findFirst: async () => {
            assert.equal(studentExists, true);
            return null;
          },
        },
        invoice: { create: () => assert.fail('must not create an ineligible invoice') },
      });
    await assert.rejects(
      createInvoice(scope, input),
      studentExists ? /outside the selected school or inactive/ : /Student not found/
    );
  }
});

test('ad hoc invoice without a fee keeps student eligibility validation', async () => {
  db.$transaction = async (work) =>
    work({
      student: { findFirst: async () => ({ id: 'student' }) },
      invoice: { create: async ({ data }) => data },
    });
  const { feeId, ...withoutFee } = input;
  assert.equal(feeId, 'fee');
  assert.equal((await createInvoice(scope, withoutFee)).total, 90);
});

test('invalid invoice amounts fail before opening a transaction', async () => {
  db.$transaction = () => assert.fail('must not open a transaction');
  await assert.rejects(createInvoice(scope, { ...input, discount: 101 }), /amounts are invalid/);
});

test('invoice persistence failure is propagated without returning a success', async () => {
  db.$transaction = async (work) =>
    work({
      student: { findFirst: async () => ({ id: 'student' }) },
      fee: { findFirst: async () => ({ id: 'fee' }) },
      invoice: {
        create: async () => {
          throw new Error('write failed');
        },
      },
    });
  await assert.rejects(createInvoice(scope, input), /write failed/);
});
