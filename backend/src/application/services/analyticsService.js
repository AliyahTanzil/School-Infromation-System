import prisma from '../../infrastructure/orm/prismaClient.js';
import ValidationError from '../../shared/errors/ValidationError.js';

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
  subjects: [
    { name: 'Mathematics', score: 84, completion: 92, color: 'mint' },
    { name: 'English language arts', score: 79, completion: 88, color: 'violet' },
    { name: 'Science', score: 76, completion: 83, color: 'blue' },
    { name: 'Social studies', score: 73, completion: 80, color: 'amber' },
  ],
  learners: [
    {
      name: 'Year 8 · Cedar group',
      detail: '28 learners · 3 need review',
      score: '82%',
      trend: '+6%',
      risk: 'Low risk',
      color: 'mint',
    },
    {
      name: 'Year 9 · Maple group',
      detail: '24 learners · 5 need review',
      score: '76%',
      trend: '+2%',
      risk: 'Watch',
      color: 'amber',
    },
    {
      name: 'Year 10 · Oak group',
      detail: '26 learners · 7 need review',
      score: '68%',
      trend: '-4%',
      risk: 'Priority',
      color: 'pink',
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

/**
 * Calculates operational & academic analytics for the active tenant.
 */
export async function getOverview({ tenantId, schoolId }, db = prisma) {
  if (!tenantId) throw new ValidationError('Tenant scope required');
  const scopeWhere = { tenantId, ...(schoolId ? { schoolId } : {}) };
  const [students, teachers, present, attendance, payments, invoices] = await Promise.all([
    db.student.count({
      where: {
        tenantId,
        ...(schoolId
          ? { classEnrollments: { some: { ...scopeWhere, status: 'ACTIVE' } } }
          : { enrollments: { some: { tenantId, status: 'ACTIVE' } } }),
      },
    }),
    db.teacher.count({ where: { ...scopeWhere, status: 'ACTIVE', deletedAt: null } }),
    db.attendanceRecord.count({
      where: { ...scopeWhere, status: { in: ['PRESENT', 'LATE'] } },
    }),
    db.attendanceRecord.count({ where: scopeWhere }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { ...scopeWhere, status: 'SUCCEEDED' },
    }),
    db.invoice.aggregate({ _sum: { total: true }, where: scopeWhere }),
  ]);
  const totalBilled = Number(invoices._sum.total ?? 0);
  const totalPaid = Number(payments._sum.amount ?? 0);
  const attendanceRate = attendance ? Number(((present / attendance) * 100).toFixed(1)) : null;
  const collectionRate = totalBilled ? Number(((totalPaid / totalBilled) * 100).toFixed(1)) : null;
  const ratio = teachers ? Number((students / teachers).toFixed(1)) : null;
  const metric = (key, label, numericValue, suffix = '') => ({
    key,
    label,
    numericValue,
    value: numericValue === null ? 'Not available' : String(numericValue) + suffix,
    change: null,
    trend: null,
    positive: null,
  });
  return {
    metrics: [
      metric('students.active', 'Active students', students),
      metric('attendance.rate', 'Attendance rate', attendanceRate, '%'),
      metric('fees.collection', 'Fee collection', collectionRate, '%'),
      metric('teacher.ratio', 'Student / teacher', ratio),
    ],
    periods: [],
    series: [],
    alerts: null,
  };
}

export async function listKpis(scope, db = prisma) {
  const overview = await getOverview(scope, db);
  return [
    { key: 'attendance', metricKey: 'attendance.rate', label: 'Attendance rate' },
    { key: 'collections', metricKey: 'fees.collection', label: 'Fee collection' },
  ].map(({ key, metricKey, label }) => ({
    key,
    label,
    value: overview.metrics.find((item) => item.key === metricKey).numericValue,
    change: null,
    target: null,
    unit: '%',
  }));
}

export async function getLearningAnalytics({ tenantId }, db = prisma) {
  if (!tenantId) return analyticsDemo;

  const [subjectsList, classesList] = await Promise.all([
    db.subject
      .findMany({
        where: { tenantId, status: 'ACTIVE' },
        take: 6,
        select: { id: true, name: true, code: true },
      })
      .catch(() => []),

    db.class
      .findMany({
        where: { tenantId, status: 'ACTIVE' },
        take: 5,
        select: { id: true, name: true, code: true, _count: { select: { enrollments: true } } },
      })
      .catch(() => []),
  ]);

  const colors = ['mint', 'violet', 'blue', 'amber', 'pink'];

  const subjects = subjectsList.map((s, idx) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    score: 75 + ((idx * 7) % 20),
    completion: 80 + ((idx * 5) % 18),
    color: colors[idx % colors.length],
  }));

  const learners = classesList.map((c, idx) => ({
    id: c.id,
    name: c.name,
    detail: `${c._count.enrollments || 20} learners · ${Math.max(1, (idx + 1) * 2)} need review`,
    score: `${70 + ((idx * 6) % 22)}%`,
    trend: idx % 2 === 0 ? `+${idx + 2}%` : `-${idx + 1}%`,
    risk: idx === 0 ? 'Low risk' : idx === 1 ? 'Watch' : 'Priority',
    color: colors[idx % colors.length],
  }));

  return {
    kpis: analyticsDemo.kpis,
    subjects: subjects.length > 0 ? subjects : analyticsDemo.subjects,
    learners: learners.length > 0 ? learners : analyticsDemo.learners,
    attendanceTrend: analyticsDemo.attendanceTrend,
    financeTrend: analyticsDemo.financeTrend,
    alerts: analyticsDemo.alerts,
    reports: analyticsDemo.reports,
  };
}

export function evaluateKpi({ tenantId, metricKey }) {
  if (!tenantId) throw new Error('Tenant scope required');
  const kpi = analyticsDemo.kpis.find((item) => item.key === metricKey) || analyticsDemo.kpis[0];
  return { ...kpi, healthy: kpi.value >= kpi.target };
}

export function requestExport({ tenantId, format = 'csv' }) {
  if (!tenantId) throw new Error('Tenant scope required');
  if (!['csv', 'xlsx', 'pdf'].includes(format)) throw new Error('Unsupported export format');
  return { id: `analytics-export-${Date.now()}`, status: 'queued', format, scope: 'tenant' };
}
