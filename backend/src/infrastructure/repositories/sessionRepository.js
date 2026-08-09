import prisma from '../orm/prismaClient.js';

/**
 * SessionRepository — manages UserSession records. A session represents a
 * single logged-in device and is the parent of a chain of rotated refresh
 * tokens.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function create(
  { userId, deviceName, deviceType, deviceHash, ipAddress, userAgent, expiresAt },
  tx
) {
  return db(tx).userSession.create({
    data: { userId, deviceName, deviceType, deviceHash, ipAddress, userAgent, expiresAt },
  });
}

export function findActiveById(id, tx) {
  return db(tx).userSession.findFirst({
    where: { id, revokedAt: null, expiresAt: { gt: new Date() } },
  });
}

export function listActiveByUser(userId, tx) {
  return db(tx).userSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export function touch(id, { ipAddress, userAgent } = {}, tx) {
  return db(tx).userSession.update({
    where: { id },
    data: {
      lastActiveAt: new Date(),
      ...(ipAddress ? { ipAddress } : {}),
      ...(userAgent ? { userAgent } : {}),
    },
  });
}

export function revoke(id, reason, tx) {
  return db(tx).userSession.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'user_logout' },
  });
}

export function revokeAllForUser(userId, reason, tx) {
  return db(tx).userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'logout_all' },
  });
}

export function revokeAllForUserExcept(userId, exceptSessionId, reason, tx) {
  return db(tx).userSession.updateMany({
    where: { userId, revokedAt: null, id: { not: exceptSessionId } },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'password_changed' },
  });
}

export default {
  create,
  findActiveById,
  listActiveByUser,
  touch,
  revoke,
  revokeAllForUser,
  revokeAllForUserExcept,
};
