import { z } from 'zod';
import prisma from '../../infrastructure/orm/prismaClient.js';

const actionSchema = z.object({
  action: z.enum(['acknowledge-incident', 'schedule-maintenance']),
  targetId: z.string().min(1).max(120),
});

const services = [
  { key: 'api', name: 'Core API', status: 'OPERATIONAL', latencyMs: 84, uptimePercent: 99.98 },
  {
    key: 'database',
    name: 'Primary database',
    status: 'OPERATIONAL',
    latencyMs: 41,
    uptimePercent: 99.99,
  },
  {
    key: 'notifications',
    name: 'Notification delivery',
    status: 'DEGRADED',
    latencyMs: 312,
    uptimePercent: 99.72,
  },
  {
    key: 'storage',
    name: 'Document storage',
    status: 'OPERATIONAL',
    latencyMs: 116,
    uptimePercent: 99.95,
  },
];

export function getOverview() {
  return {
    summary: { tenants: 18, schools: 42, activeUsers: 12840, openIncidents: 1, securityEvents: 3 },
    services,
    incidents: [
      {
        id: 'inc-204',
        title: 'Notification delivery latency elevated',
        severity: 'WARNING',
        status: 'INVESTIGATING',
        service: 'Notification delivery',
        startedAt: '2026-08-11T09:18:00Z',
      },
    ],
    maintenance: [
      {
        title: 'Database index maintenance',
        scope: 'Primary database',
        startsAt: '2026-08-14T02:00:00Z',
        endsAt: '2026-08-14T02:30:00Z',
      },
    ],
    backups: [
      {
        scope: 'Production PostgreSQL',
        status: 'VERIFIED',
        size: '8.4 GB',
        completedAt: '2026-08-11T03:15:00Z',
      },
    ],
    integrations: [
      { name: 'Vercel AI Gateway', status: 'CONNECTED' },
      { name: 'Email delivery', status: 'CONNECTED' },
      { name: 'Payment provider', status: 'SANDBOX' },
    ],
    security: [
      { event: 'Blocked repeated login attempts', severity: 'WARNING', time: '18 min ago' },
      { event: 'Admin policy updated', severity: 'INFO', time: '46 min ago' },
    ],
  };
}

export async function runAction(input, actorId) {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid platform action');
  const audit = await prisma.auditLog.create({
    data: {
      actorId,
      action: 'UPDATE',
      entityType: 'PLATFORM_OPERATION',
      metadata: {
        operation: parsed.data.action,
        targetId: parsed.data.targetId,
        source: 'platform-admin',
      },
    },
  });
  return {
    ok: true,
    auditId: audit.id,
    status: 'recorded',
    message: `${parsed.data.action} recorded for audited review.`,
  };
}
