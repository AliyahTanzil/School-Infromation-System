import ValidationError from '../shared/errors/ValidationError.js';

export function calculateInvoice({ subtotal, discount = 0 }) {
  const base = Number(subtotal);
  const reduction = Number(discount);
  if (
    !Number.isFinite(base) ||
    base < 0 ||
    !Number.isFinite(reduction) ||
    reduction < 0 ||
    reduction > base
  ) {
    throw new ValidationError('Invoice amounts are invalid');
  }
  const total = Math.round((base - reduction) * 100) / 100;
  return { subtotal: base, discount: reduction, total, balance: total };
}

export function nextInvoiceStatus(balance, total) {
  if (balance <= 0) return 'PAID';
  if (balance < total) return 'PARTIALLY_PAID';
  return 'ISSUED';
}

export default { calculateInvoice, nextInvoiceStatus };
