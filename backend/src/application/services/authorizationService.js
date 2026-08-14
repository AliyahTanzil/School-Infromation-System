import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

const cache = new Map();
const CACHE_TTL_MS = 30_000;

function cacheKey(userId, scopeKey) {
  return `${userId}:${scopeKey ?? 'global'}`;
}

export async function effectivePermissions(userId, scopeKey = 'global') {
  const key = cacheKey(userId, scopeKey);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.permissions;

  const now = new Date();
  const assignments = await prisma.userRole.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      role: { deletedAt: null },
    },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  const permissions = new Map();
  for (const assignment of assignments) {
    for (const grant of assignment.role.rolePermissions) {
      if (grant.permission.deletedAt) continue;
      const current = permissions.get(grant.permission.code);
      if (!current || grant.permission.effect === 'DENY')
        permissions.set(grant.permission.code, {
          allowed: grant.permission.effect === 'ALLOW',
          source: 'direct',
          roleCode: assignment.role.code,
        });
    }
  }
  const result = Object.fromEntries(permissions);
  cache.set(key, { permissions: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function can(userId, permissionCode, scopeKey = 'global') {
  const permissions = await effectivePermissions(userId, scopeKey);
  return permissions[permissionCode]?.allowed === true;
}

export async function assertCan(userId, permissionCode, scopeKey = 'global') {
  if (!(await can(userId, permissionCode, scopeKey)))
    throw new AuthorizationError('Forbidden', 'FORBIDDEN');
  return true;
}

export function invalidate(userId, scopeKey) {
  if (userId) cache.delete(cacheKey(userId, scopeKey));
  else cache.clear();
}

export default { effectivePermissions, can, assertCan, invalidate };
