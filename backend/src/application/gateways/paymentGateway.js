export const PaymentStatus = Object.freeze({
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
});

export class MockPaymentGateway {
  constructor(code = 'mock') {
    this.code = code;
  }
  async createPaymentIntent(request) {
    return {
      provider: this.code,
      status: PaymentStatus.PENDING,
      externalReference: `MOCK-${request.internalReference}`,
      checkoutUrl: null,
    };
  }
  async getPaymentStatus(externalReference) {
    return { provider: this.code, externalReference, status: PaymentStatus.SUCCEEDED };
  }
  async verifyPayment(payload) {
    return {
      verified: payload.signature === 'mock-signature',
      status: payload.status || PaymentStatus.SUCCEEDED,
      externalReference: payload.externalReference,
    };
  }
  async cancelPayment(externalReference) {
    return { provider: this.code, externalReference, status: PaymentStatus.CANCELLED };
  }
  async refundPayment(request) {
    return {
      provider: this.code,
      externalReference: `REFUND-${request.intentId}`,
      status: PaymentStatus.SUCCEEDED,
    };
  }
  async healthCheck() {
    return { healthy: true, latencyMs: 1 };
  }
}

import { MonimePaymentGateway } from './monimePaymentGateway.js';

export function gatewayFor(provider = 'mock') {
  return provider === 'monime' ? new MonimePaymentGateway(provider) : new MockPaymentGateway(provider);
}
