import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export async function getSmartIdentityOverview({ tenantId, schoolId }) {
  const scope = { tenantId, ...(schoolId ? { schoolId } : {}) };
  const [identities, verified, failed, devices, offline] = await Promise.all([
    prisma.smartIdentity.count({ where: scope }),
    prisma.smartIdentityVerification.count({ where: { ...scope, status: 'SUCCESS' } }),
    prisma.smartIdentityVerification.count({
      where: { ...scope, status: { in: ['FAILURE', 'LOCKED'] } },
    }),
    prisma.smartIdentityDevice.count({ where: { identity: scope, revokedAt: null } }),
    prisma.smartIdentityOfflineEvent.count({ where: { tenantId, processedAt: null } }),
  ]);
  return {
    identities,
    verified,
    failed,
    devices,
    offlineQueue: offline,
    trustRate: identities ? Math.round((verified / Math.max(verified + failed, 1)) * 100) : 0,
  };
}

export async function listSmartIdentityVerifications({ tenantId, schoolId }) {
  return prisma.smartIdentityVerification.findMany({
    where: { tenantId, ...(schoolId ? { schoolId } : {}) },
    orderBy: { occurredAt: 'desc' },
    take: 20,
    select: {
      id: true,
      provider: true,
      status: true,
      reasonCode: true,
      occurredAt: true,
      identity: { select: { displayName: true, subjectType: true } },
    },
  });
}

export async function recordVerification({
  tenantId,
  schoolId,
  provider = 'QR',
  value,
  deviceHash,
  success = true,
}) {
  const valueHash = hash(value);
  const identifier = await prisma.smartIdentityIdentifier.findFirst({
    where: {
      provider,
      valueHash,
      status: 'ACTIVE',
      identity: { tenantId, ...(schoolId ? { schoolId } : {}) },
    },
    select: { identityId: true },
  });
  return prisma.smartIdentityVerification.create({
    data: {
      tenantId,
      schoolId,
      identityId: identifier?.identityId,
      provider,
      status: success && identifier ? 'SUCCESS' : 'FAILURE',
      reasonCode: identifier ? null : 'IDENTIFIER_NOT_FOUND',
      deviceHash: deviceHash ? hash(deviceHash) : null,
    },
  });
}

export { hash };
