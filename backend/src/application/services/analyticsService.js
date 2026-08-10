import prisma from '../../infrastructure/orm/prismaClient.js';

const demoMetrics = [
  {
    key: 'students.active',
    label: 'Active students',
    value: '2,486',
    change: '+4.8%',
    trend: 'up',
  },
  {
    key: 'attendance.rate',
    label: 'Attendance rate',
    value: '94.2%',
    change: '+1.6%',
    trend: 'up',
  },
  { key: 'fees.collection', label: 'Fee collection', value: '82.7%', change: '+6.2%', trend: 'up' },
  {
    key: 'teacher.ratio',
    label: 'Student / teacher',
    value: '18.4',
    change: '-0.9',
    trend: 'down',
  },
];

export async function getOverview({ tenantId, schoolId }) {
  if (!tenantId)
    return {
      metrics: demoMetrics,
      periods: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
      series: [72, 76, 74, 81, 84, 88],
      alerts: 3,
    };
  const [metrics, alerts] = await Promise.all([
    prisma.analyticsMetric.findMany({
      where: { tenantId, ...(schoolId ? { schoolId } : {}) },
      orderBy: { category: 'asc' },
      take: 12,
    }),
    prisma.securityEvent
      .count({ where: { tenantId, ...(schoolId ? { schoolId } : {}), status: 'OPEN' } })
      .catch(() => 0),
  ]);
  return { metrics, periods: [], series: [], alerts };
}

export async function listKpis({ tenantId, schoolId }) {
  if (!tenantId) return demoMetrics;
  return prisma.kPIDefinition.findMany({
    where: { tenantId, ...(schoolId ? { schoolId } : {}), status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    take: 50,
  });
}
