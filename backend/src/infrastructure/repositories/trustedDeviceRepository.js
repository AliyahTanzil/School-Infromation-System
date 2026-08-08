import prisma from '../orm/prismaClient.js';

/**
 * TrustedDeviceRepository — remembers devices a user has authenticated from,
 * keyed by a per-user fingerprint. Foundation for future "skip 2FA on trusted
 * device" behavior (the 2FA framework arrives with this module's schema).
 */

/** @param {import('@prisma/client').Prisma.TransactionClient} [tx] */
const db = (tx) => tx ?? prisma;

export function findByFingerprint(userId, fingerprint, tx) {
  return db(tx).trustedDevice.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  });
}

/**
 * Insert or refresh a device record (upsert on the composite unique key).
 */
export function upsert({ userId, fingerprint, name, userAgent, lastIp }, tx) {
  return db(tx).trustedDevice.upsert({
    where: { userId_fingerprint: { userId, fingerprint } },
    create: { userId, fingerprint, name, userAgent, lastIp },
    update: { lastSeenAt: new Date(), userAgent, lastIp, revokedAt: null },
  });
}

export function listByUser(userId, tx) {
  return db(tx).trustedDevice.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });
}

export function revoke(userId, fingerprint, tx) {
  return db(tx).trustedDevice.updateMany({
    where: { userId, fingerprint, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export default { findByFingerprint, upsert, listByUser, revoke };
