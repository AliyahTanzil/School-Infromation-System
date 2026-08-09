import prisma from '../../infrastructure/orm/prismaClient.js';
import userRepo from '../../infrastructure/repositories/userManagementRepository.js';
import profileRepo from '../../infrastructure/repositories/userProfileRepository.js';
import auditRepo from '../../infrastructure/repositories/userAuditRepository.js';
import sessionRepo from '../../infrastructure/repositories/sessionRepository.js';
import refreshRepo from '../../infrastructure/repositories/refreshTokenRepository.js';
import { toUserDto, toUserListDto } from '../dtos/userDto.js';
import { ConflictError, NotFoundError, AuthorizationError } from '../../shared/errors/index.js';
import passwordService from '../../infrastructure/hash/passwordService.js';

const validTransitions = {
  PENDING_VERIFICATION: new Set(['ACTIVE', 'SUSPENDED']),
  ACTIVE: new Set(['SUSPENDED', 'LOCKED']),
  SUSPENDED: new Set(['ACTIVE', 'LOCKED']),
  LOCKED: new Set(['ACTIVE', 'SUSPENDED']),
};

async function audit(data, tx) {
  return auditRepo.create(data, tx);
}

export async function listUsers(query) {
  const rows = await userRepo.list(query);
  const pageSize = Math.min(Math.max(Number(query?.pageSize) || 25, 1), 100);
  const hasMore = rows.length > pageSize;
  return {
    items: rows.slice(0, pageSize).map(toUserListDto),
    nextCursor: hasMore ? rows[pageSize - 1].id : null,
  };
}

export async function getUser(id, includeDeleted = false) {
  const user = await userRepo.findById(id, { includeDeleted });
  if (!user) throw new NotFoundError('User not found');
  return toUserDto(user);
}

export async function createUser(input, actorId, requestContext = {}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email } });
  const passwordHash = await passwordService.hashPassword(input.password);
  if (existing && !existing.deletedAt)
    throw new ConflictError('A user with this email already exists');
  const user = await prisma.$transaction(async (tx) => {
    const created = await userRepo.create(
      { email, passwordHash, status: input.status ?? 'PENDING_VERIFICATION' },
      tx
    );
    if (input.profile) await profileRepo.upsert(created.id, input.profile, tx);
    if (input.preference) await profileRepo.upsertPreference(created.id, input.preference, tx);
    await audit(
      {
        actorId,
        subjectId: created.id,
        eventType: 'CREATED',
        beforeJson: undefined,
        afterJson: { email, status: created.status },
        ...requestContext,
      },
      tx
    );
    return userRepo.findById(created.id, {}, tx);
  });
  return toUserDto(user);
}

export async function updateUser(id, input, actorId, requestContext = {}) {
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError('User not found');
  const user = await prisma.$transaction(async (tx) => {
    const updated = await userRepo.update(
      id,
      { ...(input.email ? { email: input.email.toLowerCase() } : {}) },
      tx
    );
    if (input.profile) await profileRepo.upsert(id, input.profile, tx);
    if (input.preference) await profileRepo.upsertPreference(id, input.preference, tx);
    await audit(
      {
        actorId,
        subjectId: id,
        eventType: input.profile ? 'PROFILE_UPDATED' : 'UPDATED',
        beforeJson: { email: existing.email },
        afterJson: { email: updated.email },
        ...requestContext,
      },
      tx
    );
    return userRepo.findById(id, {}, tx);
  });
  return toUserDto(user);
}

export async function changeStatus(id, status, actorId, reason, requestContext = {}) {
  if (id === actorId && status !== 'ACTIVE')
    throw new AuthorizationError('You cannot deactivate or suspend yourself', 'SELF_LOCKOUT');
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError('User not found');
  if (existing.status === status) return toUserDto(existing);
  if (!validTransitions[existing.status]?.has(status))
    throw new ConflictError(`Invalid status transition from ${existing.status} to ${status}`);
  const user = await prisma.$transaction(async (tx) => {
    await userRepo.updateStatus(id, status, tx);
    if (['SUSPENDED', 'LOCKED'].includes(status)) {
      await sessionRepo.revokeAllForUser(id, `status_${status.toLowerCase()}`, tx);
      await refreshRepo.revokeAllForUser(id, `status_${status.toLowerCase()}`, tx);
    }
    await audit(
      {
        actorId,
        subjectId: id,
        eventType: 'STATUS_CHANGED',
        beforeJson: { status: existing.status },
        afterJson: { status },
        reason,
        ...requestContext,
      },
      tx
    );
    return userRepo.findById(id, {}, tx);
  });
  return toUserDto(user);
}

export async function deleteUser(id, actorId, reason, requestContext = {}) {
  if (id === actorId) throw new AuthorizationError('You cannot delete yourself', 'SELF_DELETE');
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError('User not found');
  const user = await prisma.$transaction(async (tx) => {
    const deleted = await userRepo.softDelete(id, tx);
    await sessionRepo.revokeAllForUser(id, 'account_deleted', tx);
    await refreshRepo.revokeAllForUser(id, 'account_deleted', tx);
    await audit(
      {
        actorId,
        subjectId: id,
        eventType: 'DELETED',
        beforeJson: { status: existing.status },
        afterJson: { deletedAt: deleted.deletedAt },
        reason,
        ...requestContext,
      },
      tx
    );
    return deleted;
  });
  return toUserDto(user);
}

export async function restoreUser(id, actorId, requestContext = {}) {
  const existing = await userRepo.findById(id, { includeDeleted: true });
  if (!existing?.deletedAt) throw new NotFoundError('Deleted user not found');
  const restored = await prisma.$transaction(async (tx) => {
    await userRepo.restore(id, tx);
    await audit(
      {
        actorId,
        subjectId: id,
        eventType: 'RESTORED',
        afterJson: { deletedAt: null },
        ...requestContext,
      },
      tx
    );
    return userRepo.findById(id, {}, tx);
  });
  return toUserDto(restored);
}

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  changeStatus,
  deleteUser,
  restoreUser,
};
