import prisma from '../orm/prismaClient.js';

const SENSITIVE_KEY = /password|token|secret|authorization|cookie|api[-_]?key/i;

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : value,
    ])
  );
}

export function record(
  { tenantId, actorId, action, entityType, entityId, metadata, ipAddress },
  tx
) {
  const db = tx ?? prisma;
  return db.auditLog.create({
    data: {
      tenantId: tenantId ?? null,
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: safeMetadata(metadata),
      ipAddress: ipAddress ?? null,
    },
  });
}

export function listByTenant(tenantId, { take = 100 } = {}, tx) {
  const db = tx ?? prisma;
  return db.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(Number(take) || 100, 1), 500),
  });
}

export default { record, listByTenant };
