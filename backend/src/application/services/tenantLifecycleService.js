import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const safeTenant = (tenant) => ({
  id: tenant.id,
  name: tenant.name,
  code: tenant.code,
  status: tenant.status,
  timezone: tenant.timezone,
  currency: tenant.currency,
  createdAt: tenant.createdAt,
  counts: tenant._count
    ? {
        schools: tenant._count.schools,
        users: tenant._count.users,
        students: tenant._count.students,
      }
    : undefined,
});

const tenantInclude = {
  _count: { select: { schools: true, users: true, students: true } },
};

const audit = (tx, actorId, tenantId, action, entityType, entityId, metadata) =>
  tx.auditLog.create({
    data: { actorId, tenantId, action, entityType, entityId, metadata },
  });

async function assertOwner(actor) {
  const owner = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { platformRole: true, status: true, deletedAt: true },
  });
  if (!owner || owner.platformRole !== 'OWNER' || owner.status !== 'ACTIVE' || owner.deletedAt)
    throw new AuthorizationError('Platform owner access required');
}

export async function listTenants(actor) {
  await assertOwner(actor);
  return (
    await prisma.tenant.findMany({
      where: { deletedAt: null },
      include: tenantInclude,
      orderBy: { name: 'asc' },
    })
  ).map(safeTenant);
}

export async function getTenant(actor, tenantId) {
  await assertOwner(actor);
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    include: {
      ...tenantInclude,
      schools: { orderBy: { name: 'asc' } },
      settings: { orderBy: { key: 'asc' } },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { actor: { select: { email: true, platformRole: true } } },
      },
    },
  });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return {
    ...safeTenant(tenant),
    schools: tenant.schools,
    features: tenant.settings
      .filter((item) => item.key.startsWith('feature.'))
      .map((item) => ({ key: item.key.slice(8), enabled: item.value === true })),
    settings: tenant.settings.filter((item) => !item.key.startsWith('feature.')),
    audit: tenant.auditLogs.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      metadata: item.metadata,
      createdAt: item.createdAt,
      actor: item.actor?.email ?? 'System',
      role: item.actor?.platformRole ?? null,
    })),
  };
}

export async function createTenant(actor, input) {
  await assertOwner(actor);
  const code = input.code.trim().toUpperCase();
  const exists = await prisma.tenant.findUnique({ where: { code } });
  if (exists) throw new ConflictError('Tenant code is already in use');
  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        name: input.name.trim(),
        code,
        timezone: input.timezone || 'UTC',
        currency: input.currency || 'USD',
        status: 'PENDING',
      },
      include: tenantInclude,
    });
    await audit(tx, actor.id, created.id, 'CREATE', 'Tenant', created.id, { code });
    return created;
  });
  return safeTenant(tenant);
}

export async function updateTenant(actor, tenantId, input) {
  await assertOwner(actor);
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return safeTenant(
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: input.name, timezone: input.timezone, currency: input.currency },
    })
  );
}

export async function changeTenantStatus(actor, tenantId, status) {
  await assertOwner(actor);
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!tenant) throw new NotFoundError('Tenant not found');
  const allowedStatuses = new Set(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']);
  if (!allowedStatuses.has(status)) throw new ConflictError('Unsupported tenant status');
  if (tenant.status === status) return safeTenant(tenant);
  if (status === 'ARCHIVED') {
    const activeUsers = await prisma.user.count({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    });
    if (activeUsers > 0) throw new ConflictError('Suspend active users before archiving a tenant');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.tenant.update({
      where: { id: tenantId },
      data: { status, deletedAt: status === 'ARCHIVED' ? new Date() : null },
      include: tenantInclude,
    });
    await audit(tx, actor.id, tenantId, 'UPDATE', 'Tenant', tenantId, {
      fromStatus: tenant.status,
      toStatus: status,
    });
    return result;
  });
  return safeTenant(updated);
}

export async function setTenantFeature(actor, tenantId, key, enabled) {
  await assertOwner(actor);
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(key)) throw new ConflictError('Invalid feature key');
  if (typeof enabled !== 'boolean') throw new ConflictError('Feature state must be boolean');
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!tenant) throw new NotFoundError('Tenant not found');
  const setting = await prisma.$transaction(async (tx) => {
    const result = await tx.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key: `feature.${key}` } },
      update: { value: enabled },
      create: { tenantId, key: `feature.${key}`, value: enabled },
    });
    await audit(tx, actor.id, tenantId, 'UPDATE', 'TenantFeature', key, { enabled });
    return result;
  });
  return { key, enabled: setting.value === true };
}

export async function createTenantSchool(actor, tenantId, input) {
  await assertOwner(actor);
  const name = String(input.name ?? '').trim();
  const code = String(input.code ?? '')
    .trim()
    .toUpperCase();
  if (name.length < 2 || !/^[A-Z0-9_-]{2,20}$/.test(code)) {
    throw new ConflictError('A valid school name and code are required');
  }
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        tenantId,
        name,
        code,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        country: input.country?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      },
    });
    await audit(tx, actor.id, tenantId, 'CREATE', 'School', school.id, { code });
    return school;
  });
}

export default {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  changeTenantStatus,
  setTenantFeature,
  createTenantSchool,
};
