import crypto from 'node:crypto';
import { PaymentStatus } from './paymentGateway.js';

const required = ['MONIME_API_BASE_URL', 'MONIME_ACCESS_TOKEN', 'MONIME_SPACE_ID'];

function config() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Monime is not configured. Missing: ${missing.join(', ')}`);
  return { baseUrl: process.env.MONIME_API_BASE_URL.replace(/\/$/, ''), token: process.env.MONIME_ACCESS_TOKEN, spaceId: process.env.MONIME_SPACE_ID };
}

async function request(path, init = {}) {
  const { baseUrl, token, spaceId } = config();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-space-id': spaceId, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Monime request failed (${response.status})`);
  return body.data || body;
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'PAID'].includes(value)) return PaymentStatus.SUCCEEDED;
  if (['FAILED', 'DECLINED', 'REJECTED'].includes(value)) return PaymentStatus.FAILED;
  if (['EXPIRED'].includes(value)) return PaymentStatus.EXPIRED;
  if (['CANCELLED', 'CANCELED'].includes(value)) return PaymentStatus.CANCELLED;
  return PaymentStatus.PENDING;
}

export class MonimePaymentGateway {
  constructor(code = 'monime') { this.code = code; }
  async createPaymentIntent(requestData) {
    const result = await request('/v1/payments', { method: 'POST', body: JSON.stringify({ amount: requestData.amountMinor, currency: requestData.currency, reference: requestData.internalReference, description: requestData.description || 'SAIS invoice payment', channel: 'USSD', metadata: requestData.metadata || {} }) });
    return { provider: this.code, status: normalizeStatus(result.status), externalReference: result.id || result.reference || requestData.internalReference, checkoutUrl: result.checkoutUrl || result.paymentUrl || null, ussdCode: result.ussdCode || result.code || null };
  }
  async getPaymentStatus(externalReference) {
    const result = await request(`/v1/payments/${encodeURIComponent(externalReference)}`);
    return { provider: this.code, externalReference, status: normalizeStatus(result.status) };
  }
  async verifyPayment(payload, signature, rawBody) {
    const secret = process.env.MONIME_WEBHOOK_SECRET;
    if (!secret || !signature) return { verified: false };
    const expected = crypto.createHmac('sha256', secret).update(rawBody || JSON.stringify(payload)).digest('hex');
    const supplied = String(signature).replace(/^sha256=/, '');
    const verified = supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
    return { verified, status: normalizeStatus(payload.status), externalReference: payload.externalReference || payload.paymentId || payload.id };
  }
  async healthCheck() { config(); return { healthy: true, provider: this.code }; }
}
