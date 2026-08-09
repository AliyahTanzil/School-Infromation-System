import prisma from '../orm/prismaClient.js';

/**
 * LoginAttemptRepository — append-only log of every authentication attempt,
 * used for throttling decisions and security forensics.
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function record({ userId, email, ipAddress, userAgent, succeeded, failureReason }, tx) {
  return db(tx).loginAttempt.create({
    data: {
      userId: userId ?? null,
      email: email.toLowerCase(),
      ipAddress,
      userAgent,
      succeeded,
      failureReason: failureReason ?? null,
    },
  });
}

/**
 * Count failed attempts for an email since a given time — the throttling key.
 */
export function countRecentFailuresByEmail(email, since, tx) {
  return db(tx).loginAttempt.count({
    where: { email: email.toLowerCase(), succeeded: false, createdAt: { gte: since } },
  });
}

export function countRecentFailuresByIp(ipAddress, since, tx) {
  return db(tx).loginAttempt.count({
    where: { ipAddress, succeeded: false, createdAt: { gte: since } },
  });
}

export default { record, countRecentFailuresByEmail, countRecentFailuresByIp };
