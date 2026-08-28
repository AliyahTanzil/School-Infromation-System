import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';
import { gatewayFor } from '../gateways/paymentGateway.js';

const ref = () => `PI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const activeStatuses = ['CREATED', 'PENDING', 'PROCESSING'];

const paymentGatewayService = {
  async createIntent(scope, input) {
    const amountMinor = Number(input.amountMinor);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0)
      throw new Error('amountMinor must be a positive integer');
    const invoice = await prisma.invoice.findFirst({ where: { id: input.invoiceId, ...scope } });
    if (!invoice) throw new Error('Invoice not found');
    if (amountMinor > Math.round(Number(invoice.balance) * 100))
      throw new Error('Payment exceeds invoice balance');
    const existing = await prisma.paymentIntent.findFirst({
      where: { ...scope, idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
    const duplicate = await prisma.paymentIntent.findFirst({
      where: { ...scope, invoiceId: input.invoiceId, status: { in: activeStatuses } },
    });
    if (duplicate) throw new Error('An active payment intent already exists for this invoice');
    return prisma.paymentIntent.create({
      data: {
        ...scope,
        invoiceId: input.invoiceId,
        studentId: invoice.studentId,
        providerId: 'monime',
        internalReference: ref(),
        idempotencyKey: input.idempotencyKey,
        amountMinor,
        currency: input.currency || 'USD',
        channel: input.channel || 'MOBILE_MONEY',
        status: 'CREATED',
        description: input.description || null,
        metadata: input.metadata || {},
        expiresAt: input.expiresAt
          ? new Date(input.expiresAt)
          : new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  },
  async initialize(id, scope) {
    const intent = await prisma.paymentIntent.findFirst({ where: { id, ...scope } });
    if (!intent) throw new Error('Payment intent not found');
    if (intent.expiresAt <= new Date())
      return prisma.paymentIntent.update({ where: { id }, data: { status: 'EXPIRED' } });
    const adapter = gatewayFor('monime');
    const response = await adapter.createPaymentIntent(intent);
    const attemptNumber =
      (await prisma.paymentAttempt.count({ where: { intentId: intent.id } })) + 1;
    await prisma.paymentAttempt.create({
      data: {
        intentId: intent.id,
        attemptNumber,
        externalReference: response.externalReference,
        providerStatus: response.status,
        status: response.status,
      },
    });
    const updated = await prisma.paymentIntent.update({
      where: { id },
      data: {
        status: response.status,
        metadata: { ...(intent.metadata || {}), checkoutUrl: response.checkoutUrl },
      },
    });
    return { ...updated, checkoutUrl: response.checkoutUrl };
  },
  async list(scope, query = {}) {
    const intents = await prisma.paymentIntent.findMany({
      where: { ...scope, ...(query.status ? { status: query.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return Promise.all(
      intents.map(async (intent) => ({
        ...intent,
        attempts: await prisma.paymentAttempt.findMany({
          where: { intentId: intent.id },
          orderBy: { attemptNumber: 'asc' },
        }),
      }))
    );
  },
  async webhook(input) {
    if (!input.eventId) throw new Error('Monime webhook event ID is required');
    const adapter = gatewayFor('monime');
    const verified = await adapter.verifyPayment(input.payload, input.signature, input.rawBody);
    if (!verified.verified) throw new Error('Invalid webhook signature');
    const existing = await prisma.gatewayWebhookEvent.findUnique({
      where: { providerId_eventId: { providerId: 'monime', eventId: input.eventId } },
    });
    if (existing) return existing;
    const attempt = await prisma.paymentAttempt.findFirst({
      where: { externalReference: verified.externalReference },
    });
    if (!attempt) throw new Error('Webhook payment reference is unknown');
    const intent = await prisma.paymentIntent.findUniqueOrThrow({
      where: { id: attempt.intentId },
    });
    return prisma.$transaction(async (tx) => {
      const event = await tx.gatewayWebhookEvent.create({
        data: {
          tenantId: intent.tenantId,
          schoolId: intent.schoolId,
          providerId: 'monime',
          eventId: input.eventId,
          eventType: input.eventType || 'payment.updated',
          signatureValid: true,
          processedAt: new Date(),
          payload: input.payload,
        },
      });
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { status: verified.status },
      });
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: verified.status, providerStatus: verified.status },
      });
      if (verified.status === 'SUCCEEDED') {
        const idempotencyKey = `monime:${input.eventId}`;
        const recorded = await tx.payment.findUnique({ where: { idempotencyKey } });
        if (!recorded) {
          const invoice = await tx.invoice.findFirst({
            where: { id: intent.invoiceId, tenantId: intent.tenantId, schoolId: intent.schoolId },
          });
          if (!invoice) throw new Error('Invoice for payment intent was not found');
          const amount = intent.amountMinor / 100;
          const balance = Math.max(0, Number(invoice.balance) - amount);
          const payment = await tx.payment.create({
            data: {
              tenantId: intent.tenantId,
              schoolId: intent.schoolId,
              invoiceId: intent.invoiceId,
              amount,
              provider: 'monime',
              reference: verified.externalReference,
              idempotencyKey,
              status: 'SUCCEEDED',
              paidAt: new Date(),
            },
          });
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { balance, status: balance <= 0 ? 'PAID' : 'PARTIALLY_PAID' },
          });
          await tx.financialTransaction.create({
            data: {
              tenantId: intent.tenantId,
              schoolId: intent.schoolId,
              studentId: intent.studentId,
              invoiceId: intent.invoiceId,
              paymentId: payment.id,
              type: 'PAYMENT',
              amountMinor: intent.amountMinor,
              reference: `MONIME-${input.eventId}`,
              metadata: { externalReference: verified.externalReference },
            },
          });
        }
      }
      return event;
    });
  },
  async health() {
    return gatewayFor('monime').healthCheck();
  },
};

export default paymentGatewayService;
