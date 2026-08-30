import prisma from '../orm/prismaClient.js';

export function create(data, tx) {
  const { subjectId, actorId, action, eventType, metadata, beforeJson, afterJson, reason } = data;
  return (tx ?? prisma).userAudit.create({
    data: {
      subjectId,
      actorId: actorId ?? null,
      action: action ?? eventType ?? 'UPDATED',
      metadata: metadata ?? {
        before: beforeJson ?? null,
        after: afterJson ?? null,
        reason: reason ?? null,
      },
    },
  });
}
export function listForSubject(subjectId, take = 50, tx) {
  return (tx ?? prisma).userAudit.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
export default { create, listForSubject };
