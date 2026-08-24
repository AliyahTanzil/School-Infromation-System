import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';
import { gatewayFor } from '../gateways/paymentGateway.js';

const ref = () => `PI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const activeStatuses = ['CREATED', 'PENDING', 'PROCESSING'];

const paymentGatewayService = {
  async createIntent(input) {
    const amountMinor = Number(input.amountMinor);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0)
      throw new Error('amountMinor must be a positive integer');
    const existing = await prisma.paymentIntent.findFirst({
      where: { schoolId: input.schoolId, idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
    const duplicate = await prisma.paymentIntent.findFirst({
      where: { invoiceId: input.invoiceId, status: { in: activeStatuses } },
    });
    if (duplicate) throw new Error('An active payment intent already exists for this invoice');
    return prisma.paymentIntent.create({
      data: {
        tenantId: input.tenantId,
        schoolId: input.schoolId,
        invoiceId: input.invoiceId,
        studentId: input.studentId,
        providerId: input.providerId || null,
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
  async initialize(id) {
    const intent = await prisma.paymentIntent.findUniqueOrThrow({ where: { id } });
    if (intent.expiresAt <= new Date())
      return prisma.paymentIntent.update({ where: { id }, data: { status: 'EXPIRED' } });
    const adapter = gatewayFor(intent.providerId || 'monime');
    const response = await adapter.createPaymentIntent(intent);
    await prisma.paymentAttempt.create({
      data: {
        intentId: intent.id,
        attemptNumber: 1,
        externalReference: response.externalReference,
        providerStatus: response.status,
        status: response.status,
      },
    });
    return prisma.paymentIntent.update({ where: { id }, data: { status: response.status } });
  },
  async list(query = {}) {
    return prisma.paymentIntent.findMany({
      where: { schoolId: query.schoolId, ...(query.status ? { status: query.status } : {}) },
      include: { attempts: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },
  async webhook(input) {
    const adapter = gatewayFor(input.providerId || 'monime');
    const verified = await adapter.verifyPayment(input, input.signature, input.rawBody);
    if (!verified.verified) throw new Error('Invalid webhook signature');
    const existing = await prisma.gatewayWebhookEvent.findUnique({
      where: { providerId_eventId: { providerId: input.providerId, eventId: input.eventId } },
    });
    if (existing) return existing;
    const event = await prisma.gatewayWebhookEvent.create({
      data: {
        tenantId: input.tenantId,
        schoolId: input.schoolId,
        providerId: input.providerId,
        eventId: input.eventId,
        eventType: input.eventType || 'payment.updated',
        signatureValid: true,
        processedAt: new Date(),
        payload: input,
      },
    });
    if (input.intentId)
      await prisma.paymentIntent.update({
        where: { id: input.intentId },
        data: { status: verified.status },
      });
    return event;
  },
  async health() {
    return gatewayFor(process.env.MONIME_API_BASE_URL ? 'monime' : 'mock').healthCheck();
  },
};

export default paymentGatewayService;
