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

export const analyticsDemo = {
  kpis: [
    {
      key: 'attendance',
      label: 'Attendance rate',
      value: 94.8,
      change: 1.7,
      target: 95,
      unit: '%',
    },
    {
      key: 'engagement',
      label: 'Learning engagement',
      value: 87.2,
      change: 3.4,
      target: 85,
      unit: '%',
    },
    {
      key: 'collections',
      label: 'Fee collection',
      value: 91.6,
      change: 2.1,
      target: 93,
      unit: '%',
    },
    {
      key: 'resolution',
      label: 'Case resolution',
      value: 89.4,
      change: -0.8,
      target: 90,
      unit: '%',
    },
  ],
  attendanceTrend: [
    { period: 'Sep', attendance: 91.8, engagement: 82.4 },
    { period: 'Oct', attendance: 93.1, engagement: 84.8 },
    { period: 'Nov', attendance: 92.6, engagement: 85.3 },
    { period: 'Dec', attendance: 94.2, engagement: 86.1 },
    { period: 'Jan', attendance: 94.8, engagement: 87.2 },
  ],
  financeTrend: [
    { period: 'Sep', collected: 78, billed: 100 },
    { period: 'Oct', collected: 84, billed: 100 },
    { period: 'Nov', collected: 81, billed: 100 },
    { period: 'Dec', collected: 88, billed: 100 },
    { period: 'Jan', collected: 92, billed: 100 },
  ],
  alerts: [
    {
      title: 'Grade 9 attendance below target',
      detail: 'North Campus · 3 days running',
      severity: 'warning',
    },
    {
      title: 'Collection pace improving',
      detail: 'Target gap reduced by 2.1 points',
      severity: 'positive',
    },
  ],
  reports: [
    { name: 'Executive weekly brief', status: 'Ready', lastRun: 'Today, 06:00' },
    { name: 'Attendance intervention list', status: 'Scheduled', lastRun: 'Tomorrow, 07:00' },
    { name: 'Finance collection rollup', status: 'Ready', lastRun: 'Yesterday, 18:00' },
  ],
};

export function evaluateKpi({ tenantId, metricKey }) {
  if (!tenantId) throw new Error('Tenant scope required');
  const kpi = analyticsDemo.kpis.find((item) => item.key === metricKey) || analyticsDemo.kpis[0];
  return { ...kpi, healthy: kpi.value >= kpi.target };
}

export function requestExport({ tenantId, format = 'csv' }) {
  if (!tenantId) throw new Error('Tenant scope required');
  if (!['csv', 'xlsx', 'pdf'].includes(format)) throw new Error('Unsupported export format');
  return { id: `demo-export-${Date.now()}`, status: 'queued', format, scope: 'tenant' };
}
