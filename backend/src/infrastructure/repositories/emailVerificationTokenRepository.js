import prisma from '../orm/prismaClient.js';

/**
 * EmailVerificationTokenRepository — single-use, hashed email verification
 * tokens.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function create({ tokenHash, userId, expiresAt, requestedIp, userAgent }, tx) {
  return db(tx).emailVerificationToken.create({
    data: { tokenHash, userId, expiresAt, requestedIp, userAgent },
  });
}

export function findByHash(tokenHash, tx) {
  return db(tx).emailVerificationToken.findUnique({ where: { tokenHash } });
}

export function consume(id, tx) {
  const now = new Date();
  return db(tx).emailVerificationToken.updateMany({
    where: { id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
}

export function markUsed(id, tx) {
  return db(tx).emailVerificationToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export function invalidateAllForUser(userId, tx) {
  return db(tx).emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export default { create, findByHash, consume, markUsed, invalidateAllForUser };
