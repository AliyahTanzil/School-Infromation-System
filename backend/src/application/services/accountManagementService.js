import prisma from '../../infrastructure/orm/prismaClient.js';
import passwordService from '../../infrastructure/hash/passwordService.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import sessionRepository from '../../infrastructure/repositories/sessionRepository.js';
import refreshTokenRepository from '../../infrastructure/repositories/refreshTokenRepository.js';
import authorizationService from './authorizationService.js';

const safeUser = (user) => ({
  id: user.id,
  tenantId: user.tenantId,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  status: user.status,
  accountType: user.accountType,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
  roles: user.roles?.map(({ role }) => role.code) ?? [],
});

async function requireTenantAdmin(actorId, tenantId) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    include: { roles: { include: { role: true } } },
  });
  if (!actor || (actor.platformRole !== 'OWNER' && actor.tenantId !== tenantId))
    throw new AuthorizationError('Tenant administration access required');
  if (
    actor.platformRole !== 'OWNER' &&
    !(await authorizationService.can(actorId, 'users:manage', tenantId))
  )
    throw new AuthorizationError('User management permission required');
  return actor;
}

export async function listUsers(actorId, tenantId, query = {}) {
  await requireTenantAdmin(actorId, tenantId);
  const take = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const users = await prisma.user.findMany({
    where: { tenantId, deletedAt: null, ...(query.status ? { status: query.status } : {}) },
    include: { roles: { where: { revokedAt: null }, include: { role: true } } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take,
  });
  return users.map(safeUser);
}

export async function updateProfile(actorId, input) {
  const user = await prisma.user.findUnique({ where: { id: actorId } });
  if (!user || user.deletedAt) throw new NotFoundError('User not found');
  const updated = await prisma.user.update({
    where: { id: actorId },
    data: {
      firstName: input.firstName ?? user.firstName,
      lastName: input.lastName ?? user.lastName,
      phone: input.phone ?? user.phone,
    },
    include: { roles: { include: { role: true } } },
  });
  return safeUser(updated);
}

export async function updateUser(actorId, userId, tenantId, input) {
  await requireTenantAdmin(actorId, tenantId);
  const target = await prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null } });
  if (!target) throw new NotFoundError('User not found');
  if (input.email && input.email.toLowerCase() !== target.email) {
    const duplicate = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (duplicate) throw new ConflictError('Email is already in use');
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      email: input.email?.toLowerCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
    include: { roles: { include: { role: true } } },
  });
  return safeUser(updated);
}

export async function changeStatus(actorId, userId, tenantId, status) {
  await requireTenantAdmin(actorId, tenantId);
  if (actorId === userId && status !== 'ACTIVE')
    throw new AuthorizationError('You cannot disable your own account');
  const target = await prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null } });
  if (!target) throw new NotFoundError('User not found');
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({ where: { id: userId }, data: { status } });
    if (['SUSPENDED', 'LOCKED', 'DISABLED'].includes(status)) {
      await sessionRepository.revokeAllForUser(userId, `admin_${status.toLowerCase()}`, tx);
      await refreshTokenRepository.revokeAllForUser(userId, `admin_${status.toLowerCase()}`, tx);
    }
    return result;
  });
  return safeUser(updated);
}

export async function assignRole(actorId, userId, tenantId, roleCode) {
  await requireTenantAdmin(actorId, tenantId);
  const [target, role] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null } }),
    prisma.role.findFirst({ where: { tenantId, code: roleCode, deletedAt: null } }),
  ]);
  if (!target || !role) throw new NotFoundError('User or role not found');
  if (target.accountType === 'APPLICATION_MANAGER' && actorId !== target.id)
    throw new AuthorizationError('Protected account cannot be modified');
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: { revokedAt: null },
    create: { userId, roleId: role.id },
  });
  authorizationService.invalidate(userId, tenantId);
  return safeUser(
    await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { where: { revokedAt: null }, include: { role: true } } },
    })
  );
}

export async function revokeRole(actorId, userId, tenantId, roleCode) {
  await requireTenantAdmin(actorId, tenantId);
  const role = await prisma.role.findFirst({ where: { tenantId, code: roleCode } });
  if (!role) throw new NotFoundError('Role not found');
  await prisma.userRole.updateMany({
    where: { userId, roleId: role.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  authorizationService.invalidate(userId, tenantId);
}

export default { listUsers, updateProfile, updateUser, changeStatus, assignRole, revokeRole };
