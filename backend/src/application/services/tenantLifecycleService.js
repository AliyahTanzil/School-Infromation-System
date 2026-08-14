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
    await prisma.tenant.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } })
  ).map(safeTenant);
}

export async function createTenant(actor, input) {
  await assertOwner(actor);
  const code = input.code.trim().toUpperCase();
  const exists = await prisma.tenant.findUnique({ where: { code } });
  if (exists) throw new ConflictError('Tenant code is already in use');
  return safeTenant(
    await prisma.tenant.create({
      data: {
        name: input.name.trim(),
        code,
        timezone: input.timezone || 'UTC',
        currency: input.currency || 'USD',
        status: 'PENDING',
      },
    })
  );
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
  if (tenant.status === status) return safeTenant(tenant);
  if (status === 'ARCHIVED') {
    const activeUsers = await prisma.user.count({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    });
    if (activeUsers > 0) throw new ConflictError('Suspend active users before archiving a tenant');
  }
  return safeTenant(
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status, deletedAt: status === 'ARCHIVED' ? new Date() : null },
    })
  );
}

export default { listTenants, createTenant, updateTenant, changeTenantStatus };
