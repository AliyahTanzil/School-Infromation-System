import prisma from '../orm/prismaClient.js';

/**
 * PasswordResetTokenRepository — single-use, hashed password reset tokens.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function create({ tokenHash, userId, expiresAt, requestedIp, userAgent }, tx) {
  return db(tx).passwordResetToken.create({
    data: { tokenHash, userId, expiresAt, requestedIp, userAgent },
  });
}

export function findByHash(tokenHash, tx) {
  return db(tx).passwordResetToken.findUnique({ where: { tokenHash } });
}

export function markUsed(id, tx) {
  return db(tx).passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export function invalidateAllForUser(userId, tx) {
  return db(tx).passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export default { create, findByHash, markUsed, invalidateAllForUser };
