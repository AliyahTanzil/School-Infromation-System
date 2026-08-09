import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateInvoice, nextInvoiceStatus } from '../../src/domain/financeCalculations.js';

test('calculates invoice totals and initial balance', () => {
  assert.deepEqual(calculateInvoice({ subtotal: 1000, discount: 125 }), {
    subtotal: 1000,
    discount: 125,
    total: 875,
    balance: 875,
  });
});

test('rejects discounts larger than subtotal', () => {
  assert.throws(() => calculateInvoice({ subtotal: 100, discount: 101 }));
});

test('derives payment lifecycle status', () => {
  assert.equal(nextInvoiceStatus(0, 100), 'PAID');
  assert.equal(nextInvoiceStatus(40, 100), 'PARTIALLY_PAID');
  assert.equal(nextInvoiceStatus(100, 100), 'ISSUED');
});
