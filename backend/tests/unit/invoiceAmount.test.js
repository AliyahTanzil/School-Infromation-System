import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, MAX_INVOICE_AMOUNT } from '../../src/domain/financeCalculations.js';
import { createInvoiceSchema } from '../../src/application/validators/financeValidators.js';
const body = {
  studentId: '00000000-0000-4000-8000-000000000001',
  invoiceNumber: 'INV',
  subtotal: 100,
};

test('invoice accepts zero, cents and the exact decimal-column limit', () => {
  for (const subtotal of [0, 0.01, '20.00', MAX_INVOICE_AMOUNT]) {
    assert.equal(createInvoiceSchema.safeParse({ body: { ...body, subtotal } }).success, true);
    assert.equal(calculateInvoice({ subtotal }).total, Number(subtotal));
  }
  assert.equal(
    calculateInvoice({ subtotal: MAX_INVOICE_AMOUNT, discount: MAX_INVOICE_AMOUNT }).total,
    0
  );
});

test('invoice rejects overprecision and overflow in both subtotal and discount', () => {
  for (const amount of [-1, 0.001, 1.234, 10000000000, Infinity, NaN, 'invalid']) {
    for (const amounts of [
      { subtotal: amount },
      { subtotal: MAX_INVOICE_AMOUNT, discount: amount },
    ]) {
      assert.equal(createInvoiceSchema.safeParse({ body: { ...body, ...amounts } }).success, false);
      assert.throws(() => calculateInvoice(amounts), /Invoice amounts are invalid/);
    }
  }
});

test('invoice rejects discounts above subtotal at HTTP and domain boundaries', () => {
  assert.equal(
    createInvoiceSchema.safeParse({ body: { ...body, discount: 100.01 } }).success,
    false
  );
  assert.throws(
    () => calculateInvoice({ subtotal: 100, discount: 100.01 }),
    /Invoice amounts are invalid/
  );
});

test('invoice totals subtract exact minor units across small and large amounts', () => {
  assert.equal(calculateInvoice({ subtotal: 0.3, discount: 0.1 }).total, 0.2);
  assert.equal(
    calculateInvoice({ subtotal: MAX_INVOICE_AMOUNT, discount: 9999999999.98 }).total,
    0.01
  );
  assert.equal(calculateInvoice({ subtotal: 1.23, discount: 0.29 }).balance, 0.94);
});
