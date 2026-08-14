import prisma from '../../infrastructure/orm/prismaClient.js';

export async function getSecurityOverview({ tenantId, schoolId }) {
  const scope = { tenantId, ...(schoolId ? { schoolId } : {}) };
  const [events, alerts, sessions, backups, failedLogins] = await Promise.all([
    prisma.securityEvent.count({ where: { ...scope, status: 'OPEN' } }),
    prisma.securityAlert.count({ where: { ...scope, resolvedAt: null } }),
    prisma.loginSession.count({ where: { tenantId, revokedAt: null, endedAt: null } }),
    prisma.backupJob.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.securityLoginAttempt.count({
      where: { tenantId, success: false, createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
  ]);
  return {
    openEvents: events,
    activeAlerts: alerts,
    activeSessions: sessions,
    completedBackups: backups,
    failedLogins24h: failedLogins,
  };
}

export async function listSecurityEvents({ tenantId, schoolId }) {
  return prisma.securityEvent.findMany({
    where: { tenantId, ...(schoolId ? { schoolId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function listAuditLogs({ tenantId, schoolId }) {
  return prisma.securityAuditLog.findMany({
    where: { tenantId, ...(schoolId ? { schoolId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
