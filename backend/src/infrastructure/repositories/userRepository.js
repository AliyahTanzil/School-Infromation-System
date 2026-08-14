import prisma from '../orm/prismaClient.js';

/**
 * UserRepository — data-access boundary for the User aggregate.
 * All persistence concerns live here; services stay storage-agnostic.
 */

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function findByEmail(email, tx) {
  return db(tx).user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
  });
}

export function findById(id, tx) {
  return db(tx).user.findFirst({ where: { id, deletedAt: null } });
}

export function findPublicById(id, tx) {
  return db(tx).user.findFirst({
    where: { id, deletedAt: null },
    select: SAFE_USER_SELECT,
  });
}

export function create(
  { email, passwordHash, status, accountType = 'TENANT_ADMIN', firstName, lastName, phone },
  tx
) {
  return db(tx).user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      status,
      accountType,
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      phone: phone ?? null,
    },
  });
}

export function update(id, data, tx) {
  return db(tx).user.update({ where: { id }, data });
}

export function setPasswordHash(id, passwordHash, tx) {
  return db(tx).user.update({ where: { id }, data: { passwordHash } });
}

export function markEmailVerified(id, tx) {
  return db(tx).user.update({
    where: { id },
    data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
  });
}

export function recordSuccessfulLogin(id, tx) {
  return db(tx).user.update({
    where: { id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export function incrementFailedLogins(id, { lockUntil = null } = {}, tx) {
  return db(tx).user.update({
    where: { id },
    data: {
      failedLoginCount: { increment: 1 },
      ...(lockUntil ? { lockedUntil: lockUntil, status: 'LOCKED' } : {}),
    },
  });
}

export function unlock(id, tx) {
  return db(tx).user.update({
    where: { id },
    data: { failedLoginCount: 0, lockedUntil: null, status: 'ACTIVE' },
  });
}

/**
 * Resolve the currently-effective role codes for a user (active, unrevoked,
 * unexpired assignments). Embedded into the access token so downstream
 * authorization (Module 4) can read them without a DB round-trip.
 * @returns {Promise<string[]>}
 */
export async function findActiveRoleCodes(id, tx) {
  const now = new Date();
  const assignments = await db(tx).userRole.findMany({
    where: {
      userId: id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      role: { deletedAt: null },
    },
    select: { role: { select: { code: true } } },
  });
  return [...new Set(assignments.map((a) => a.role.code))];
}

export const SAFE_SELECT = SAFE_USER_SELECT;

export default {
  findByEmail,
  findById,
  findPublicById,
  create,
  update,
  setPasswordHash,
  markEmailVerified,
  recordSuccessfulLogin,
  incrementFailedLogins,
  unlock,
  findActiveRoleCodes,
  SAFE_SELECT,
};
