import prisma from '../orm/prismaClient.js';

/**
 * AuditLoginRepository — immutable audit trail of identity-significant events
 * (see LoginEventType). Kept separate from LoginAttempt so business-level
 * events (email verified, token refreshed, session revoked) are queryable
 * independently of raw credential checks.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function record({ userId, sessionId, event, ipAddress, userAgent, metadata }, tx) {
  return db(tx).auditLogin.create({
    data: {
      userId: userId ?? null,
      sessionId: sessionId ?? null,
      event,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

export function listByUser(userId, { take = 50 } = {}, tx) {
  return db(tx).auditLogin.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export default { record, listByUser };
