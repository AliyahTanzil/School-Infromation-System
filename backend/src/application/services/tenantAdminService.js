import prisma from '../../infrastructure/orm/prismaClient.js';

const demo = {
  tenant: {
    name: 'Northstar Education Group',
    slug: 'northstar',
    plan: 'Enterprise',
    status: 'ACTIVE',
  },
  schools: [
    { name: 'Northstar Academy', code: 'NSA', status: 'ACTIVE', students: 1248 },
    { name: 'Northstar Primary', code: 'NSP', status: 'ACTIVE', students: 684 },
    { name: 'Lakeside Sixth Form', code: 'LSF', status: 'PROVISIONING', students: 312 },
  ],
  usage: [
    { label: 'Active users', value: 2841, limit: 5000 },
    { label: 'Storage', value: 68, limit: 100 },
    { label: 'API calls', value: 74200, limit: 100000 },
  ],
  flags: [
    { key: 'ai_intelligence', enabled: true },
    { key: 'smart_identity', enabled: true },
    { key: 'iot_smart_school', enabled: true },
    { key: 'parent_portal', enabled: false },
  ],
  audit: [
    { action: 'Feature enabled', entity: 'ai_intelligence', time: '18 minutes ago' },
    { action: 'School provisioned', entity: 'Lakeside Sixth Form', time: '2 hours ago' },
    { action: 'Export completed', entity: 'Tenant usage report', time: 'Yesterday' },
  ],
};

export async function getTenantOverview({ tenantId, demoMode = false } = {}) {
  if (demoMode || !tenantId || !prisma?.tenant) return demo;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { schools: true, featureFlags: true, quotas: true, usage: true, subscriptions: true },
  });
  if (!tenant) throw new Error('Tenant not found');
  return {
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.subscriptions?.[0]?.planKey ?? 'Standard',
      status: tenant.status,
    },
    schools: tenant.schools.map((s) => ({ name: s.name, code: s.slug, status: s.status })),
    flags: tenant.featureFlags,
    usage: tenant.usage,
    audit: [],
  };
}

export async function assertTenantScope({ requestedTenantId, sessionTenantId }) {
  if (!sessionTenantId || (requestedTenantId && requestedTenantId !== sessionTenantId))
    throw new Error('TENANT_SCOPE_DENIED');
  return sessionTenantId;
}
