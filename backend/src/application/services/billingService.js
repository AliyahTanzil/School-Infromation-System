import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';

const PLAN_KEYS = new Set(['starter', 'growth', 'scale']);

const toOverview = ({ subscription, usage, invoices, plans, tenantId }) => ({
  tenantId,
  plan: subscription?.plan
    ? {
        name: subscription.plan.name,
        amountMinor: subscription.plan.amountMinor,
        currency: subscription.plan.currency,
        interval: subscription.plan.interval,
      }
    : null,
  subscription: subscription
    ? {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      }
    : null,
  usage: usage.map((item) => ({
    metricKey: item.metricKey,
    quantity: item.quantity,
    includedQuantity: item.includedQuantity,
  })),
  invoices: invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.invoiceNumber,
    status: invoice.status,
    totalMinor: Math.round(Number(invoice.total) * 100),
    balanceMinor: Math.round(Number(invoice.balance) * 100),
    currency: 'USD',
    issuedAt: invoice.issuedAt,
  })),
  plans: plans.map(({ key, name, amountMinor, currency, interval, description }) => ({
    key,
    name,
    amountMinor,
    currency,
    interval,
    description,
  })),
});

export async function getBillingOverview({ tenantId }) {
  if (!tenantId) throw new Error('Tenant context is required');
  const [invoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { issuedAt: 'desc' },
      take: 12,
    }),
  ]);
  const subscription = null;
  const usage = [];
  const plans = [];
  return toOverview({ subscription, usage, invoices, plans, tenantId });
}

export function validateLifecycleAction(action) {
  const allowed = new Set(['upgrade', 'downgrade', 'cancel', 'resume']);
  if (!allowed.has(action)) throw new Error('Unsupported billing lifecycle action');
  return action;
}

export async function requestLifecycle({ tenantId, actorId, action, planKey }) {
  if (!tenantId) throw new Error('Tenant context is required');
  validateLifecycleAction(action);
  if ((action === 'upgrade' || action === 'downgrade') && !PLAN_KEYS.has(planKey)) {
    throw new Error('Unsupported billing plan');
  }
  const subscription = await prisma.billingSubscription.findFirst({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!subscription) throw new Error('No active billing subscription exists');
  const data =
    action === 'cancel'
      ? { cancelAtPeriodEnd: true }
      : action === 'resume'
        ? { cancelAtPeriodEnd: false }
        : {};
  const updated = await prisma.billingSubscription.update({ where: { id: subscription.id }, data });
  await prisma.billingAuditEvent.create({
    data: {
      tenantId,
      actorId: actorId || null,
      action: `BILLING_${action.toUpperCase()}`,
      entityType: 'BillingSubscription',
      entityId: updated.id,
      metadata: { planKey: planKey || null },
    },
  });
  return { action, status: 'accepted', subscription: updated };
}

export async function processWebhook({ provider, eventKey, payload }) {
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const existing = await prisma.billingWebhookEvent.findUnique({
    where: { provider_eventKey: { provider, eventKey } },
  });
  if (existing) return { duplicate: true, eventKey };
  await prisma.billingWebhookEvent.create({
    data: { provider, eventKey, payloadHash, processedAt: new Date() },
  });
  return { duplicate: false, eventKey };
}

export function hashProviderReference(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}
