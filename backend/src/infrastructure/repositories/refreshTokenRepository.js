import prisma from '../orm/prismaClient.js';

/**
 * RefreshTokenRepository — persists only the SHA-256 hash of each refresh
 * token. Supports rotation (parent → child linkage) and reuse detection.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function create({ tokenHash, userId, sessionId, parentTokenId, expiresAt }, tx) {
  return db(tx).refreshToken.create({
    data: { tokenHash, userId, sessionId, parentTokenId, expiresAt },
  });
}

export function findByHash(tokenHash, tx) {
  return db(tx).refreshToken.findUnique({ where: { tokenHash } });
}

export function revokeById(id, reason, tx) {
  return db(tx).refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'rotated' },
  });
}

export function revokeAllForSession(sessionId, reason, tx) {
  return db(tx).refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'session_revoked' },
  });
}

export function revokeAllForUser(userId, reason, tx) {
  return db(tx).refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'logout_all' },
  });
}

export function revokeAllForUserExcept(userId, exceptSessionId, reason, tx) {
  return db(tx).refreshToken.updateMany({
    where: { userId, revokedAt: null, sessionId: { not: exceptSessionId } },
    data: { revokedAt: new Date(), revokeReason: reason ?? 'password_changed' },
  });
}

export default {
  create,
  findByHash,
  revokeById,
  revokeAllForSession,
  revokeAllForUser,
  revokeAllForUserExcept,
};
