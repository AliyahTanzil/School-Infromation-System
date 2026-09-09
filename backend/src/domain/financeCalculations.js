import ValidationError from '../shared/errors/ValidationError.js';

// FinancialTransaction.amountMinor is a signed 32-bit database integer.
export const MAX_PAYMENT_AMOUNT = 21474836.47;
export function isValidPaymentAmount(value) {
  const amount = Number(value);
  return (
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= MAX_PAYMENT_AMOUNT &&
    Number(amount.toFixed(2)) === amount
  );
}
export function paymentMinorUnits(value) {
  if (!isValidPaymentAmount(value))
    throw new ValidationError(
      'Payment amount must be positive, have at most two decimal places and not exceed 21474836.47'
    );
  return Math.round(Number(value) * 100);
}

// Invoice monetary columns use Decimal(12, 2).
export const MAX_INVOICE_AMOUNT = 9999999999.99;
export function isValidInvoiceAmount(value) {
  const amount = Number(value);
  return (
    Number.isFinite(amount) &&
    amount >= 0 &&
    amount <= MAX_INVOICE_AMOUNT &&
    Number(amount.toFixed(2)) === amount
  );
}

export function calculateInvoice({ subtotal, discount = 0 }) {
  const base = Number(subtotal);
  const reduction = Number(discount);
  if (!isValidInvoiceAmount(base) || !isValidInvoiceAmount(reduction) || reduction > base) {
    throw new ValidationError('Invoice amounts are invalid');
  }
  const total = (Math.round(base * 100) - Math.round(reduction * 100)) / 100;
  return { subtotal: base, discount: reduction, total, balance: total };
}

export function nextInvoiceStatus(balance, total) {
  if (balance <= 0) return 'PAID';
  if (balance < total) return 'PARTIALLY_PAID';
  return 'ISSUED';
}

export default { calculateInvoice, nextInvoiceStatus };
