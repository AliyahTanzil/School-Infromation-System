import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInvoiceSchema,
  paymentSchema,
  invoiceQuerySchema,
  transactionQuerySchema,
} from '../../src/application/validators/financeValidators.js';
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/financeService.js');
const id = '00000000-0000-4000-8000-000000000001';
const scope = { tenantId: 'tenant', schoolId: 'school', userId: 'actor' };
const invoice = { studentId: id, invoiceNumber: 'INV-1', subtotal: 100 };
const payment = {
  invoiceId: id,
  amount: 20,
  provider: 'manual',
  reference: 'REF',
  idempotencyKey: 'unique-key',
};

test('finance schemas reject forged fields and invalid transaction limits', () => {
  for (const [schema, body] of [
    [createInvoiceSchema, invoice],
    [paymentSchema, payment],
  ]) {
    assert.equal(schema.safeParse({ body }).success, true);
    for (const field of ['tenantId', 'schoolId', 'userId', 'status']) {
      assert.equal(schema.safeParse({ body: { ...body, [field]: id } }).success, false);
    }
  }
  assert.equal(invoiceQuerySchema.safeParse({ query: { schoolId: id } }).success, false);
  assert.equal(transactionQuerySchema.parse({ query: {} }).query.limit, 50);
  for (const limit of ['bad', 0, -1, 1.5, 101]) {
    assert.equal(transactionQuerySchema.safeParse({ query: { limit } }).success, false);
  }
});

test('invoice creation persists only supported ownership fields from authenticated context', async () => {
  db.$transaction = async (work) => work(db);
  db.student = { findFirst: async () => ({ id }) };
  db.invoice = {
    create: async ({ data }) => {
      assert.equal(data.tenantId, 'tenant');
      assert.equal(data.schoolId, 'school');
      assert.equal('userId' in data, false);
      assert.equal(data.balance, 100);
      return data;
    },
  };
  await service.createInvoice(scope, invoice);
});

test('payment and ledger creation omit actor context and balance update retains ownership', async () => {
  db.payment = { findUnique: async () => null };
  db.$transaction = async (work) =>
    work({
      invoice: {
        findFirst: async () => ({ id, studentId: id, balance: 100, total: 100 }),
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, { id, tenantId: 'tenant', schoolId: 'school', balance: 100 });
          assert.equal(data.balance, 80);
          return { count: 1 };
        },
      },
      payment: {
        create: async ({ data }) => {
          assert.equal('userId' in data, false);
          assert.equal(data.tenantId, 'tenant');
          return { id: 'payment', ...data };
        },
      },
      financialTransaction: {
        create: async ({ data }) => {
          assert.equal('userId' in data, false);
          assert.equal(data.schoolId, 'school');
          assert.equal(data.amountMinor, 2000);
        },
      },
    });
  await service.recordPayment(scope, payment);
});

test('finance writes reject missing scope before lookup or persistence', async () => {
  await assert.rejects(service.createInvoice({}, invoice), /context is required/);
  await assert.rejects(service.recordPayment({}, payment), /context is required/);
});
