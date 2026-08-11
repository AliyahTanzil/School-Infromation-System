import prisma from '../../infrastructure/orm/prismaClient.js';

const PROVIDERS = [
  ['stripe', 'Stripe', 'Payments'],
  ['twilio', 'Twilio', 'SMS'],
  ['sendgrid', 'SendGrid', 'Email'],
  ['accounting', 'Accounting export', 'Finance'],
  ['analytics', 'Analytics warehouse', 'Analytics'],
  ['government', 'Government reporting', 'Compliance'],
];

function tenantId(req) {
  return req.user?.tenantId ?? req.user?.schoolId ?? '00000000-0000-0000-0000-000000000000';
}
export async function listIntegrations(req) {
  const id = tenantId(req);
  const rows = await prisma.integrationConnection.findMany({
    where: { tenantId: id },
    orderBy: { displayName: 'asc' },
  });
  const existing = new Map(rows.map((row) => [row.providerKey, row]));
  return PROVIDERS.map(
    ([providerKey, displayName, category]) =>
      existing.get(providerKey) ?? {
        providerKey,
        displayName,
        category,
        status: 'DISCONNECTED',
        enabled: false,
        configRedacted: {},
      }
  );
}
export async function configureIntegration(req, providerKey, input = {}) {
  const provider = PROVIDERS.find(([key]) => key === providerKey);
  if (!provider)
    throw Object.assign(new Error('Unsupported integration provider'), { statusCode: 400 });
  const id = tenantId(req);
  return prisma.integrationConnection.upsert({
    where: { tenantId_providerKey: { tenantId: id, providerKey } },
    create: {
      tenantId: id,
      providerKey,
      displayName: provider[1],
      category: provider[2],
      status: 'CONFIGURED',
      enabled: Boolean(input.enabled),
      configRedacted: { accountLabel: String(input.accountLabel ?? '').slice(0, 120) },
    },
    update: {
      status: 'CONFIGURED',
      enabled: Boolean(input.enabled),
      configRedacted: { accountLabel: String(input.accountLabel ?? '').slice(0, 120) },
    },
  });
}
export async function healthCheck(req, providerKey) {
  const id = tenantId(req);
  return prisma.integrationConnection.update({
    where: { tenantId_providerKey: { tenantId: id, providerKey } },
    data: { status: 'HEALTHY', lastHealthCheckAt: new Date() },
  });
}
export const providers = PROVIDERS;
