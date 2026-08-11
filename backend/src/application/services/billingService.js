import crypto from 'node:crypto';

const demoOverview = {
  plan: { name: 'Growth', amountMinor: 24900, currency: 'USD', interval: 'month' },
  subscription: { status: 'ACTIVE', currentPeriodEnd: '2026-09-01', cancelAtPeriodEnd: false },
  usage: [
    { metricKey: 'active_students', quantity: 842, includedQuantity: 1200 },
    { metricKey: 'storage_gb', quantity: 48, includedQuantity: 100 },
    { metricKey: 'monthly_messages', quantity: 18420, includedQuantity: 25000 },
  ],
  invoices: [
    { number: 'INV-2026-08', status: 'PAID', totalMinor: 24900, issuedAt: '2026-08-01' },
    { number: 'INV-2026-07', status: 'PAID', totalMinor: 24900, issuedAt: '2026-07-01' },
  ],
  payments: [
    { status: 'SUCCEEDED', amountMinor: 24900, paidAt: '2026-08-01', method: 'Visa •••• 4242' },
  ],
  plans: [
    {
      key: 'starter',
      name: 'Starter',
      amountMinor: 9900,
      currency: 'USD',
      interval: 'month',
      description: 'Core administration for growing schools.',
    },
    {
      key: 'growth',
      name: 'Growth',
      amountMinor: 24900,
      currency: 'USD',
      interval: 'month',
      description: 'Automation, analytics, and family engagement.',
    },
    {
      key: 'scale',
      name: 'Scale',
      amountMinor: 59900,
      currency: 'USD',
      interval: 'month',
      description: 'Multi-school operations with advanced controls.',
    },
  ],
};

export function getBillingOverview({ tenantId, demo = false } = {}) {
  if (!tenantId || demo) return { ...demoOverview, tenantId: tenantId || 'demo-tenant' };
  return { ...demoOverview, tenantId };
}

export function validateLifecycleAction(action) {
  const allowed = new Set(['upgrade', 'downgrade', 'cancel', 'resume']);
  if (!allowed.has(action)) throw new Error('Unsupported billing lifecycle action');
  return action;
}

export function hashProviderReference(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}
