import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export async function resolveAccessContext(userId, requestedTenantId = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { where: { revokedAt: null }, include: { role: true } },
    },
  });
  if (
    !user ||
    user.deletedAt ||
    user.status !== 'ACTIVE' ||
    (user.lockedUntil && user.lockedUntil.getTime() > Date.now())
  ) {
    throw new AuthorizationError('Account is not available', 'ACCOUNT_UNAVAILABLE');
  }

  const tenantId = requestedTenantId || user.tenantId || null;
  if (
    requestedTenantId &&
    user.tenantId &&
    requestedTenantId !== user.tenantId &&
    user.platformRole !== 'OWNER'
  ) {
    throw new AuthorizationError('Tenant access is not permitted', 'TENANT_CONTEXT_FORBIDDEN');
  }

  return {
    userId: user.id,
    tenantId,
    accountType: user.accountType,
    platformRole: user.platformRole,
    roles: user.roles.filter(({ role }) => !role.deletedAt).map(({ role }) => role.code),
  };
}

export default { resolveAccessContext };
