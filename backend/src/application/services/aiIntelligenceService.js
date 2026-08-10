import prisma from '../../infrastructure/orm/prismaClient.js';
import { generateAdvisory, isProviderConfigured } from '../../infrastructure/ai/openaiProvider.js';

const demo = {
  readiness: 'Advisory mode',
  insights: [
    {
      title: 'Attendance is the strongest near-term lever',
      body: 'Attendance is trending positively, but lower participation in two cohorts merits a human review.',
      severity: 'MEDIUM',
      evidence: 'Attendance rate 94.2%, +1.6% period over period.',
    },
    {
      title: 'Fee collection has room to improve',
      body: 'Prioritize targeted family outreach before broad escalation.',
      severity: 'LOW',
      evidence: 'Collection rate 82.7%, +6.2% period over period.',
    },
  ],
  risks: [
    { label: 'Attendance variance', level: 'MEDIUM', action: 'Review cohort exceptions' },
    { label: 'Fee follow-up', level: 'LOW', action: 'Draft outreach list' },
  ],
  recommendations: [
    'Review attendance exceptions by class before timetable changes.',
    'Use evidence-backed family outreach for overdue balances.',
    'Require human approval for every operational action.',
  ],
};

export async function getOverview({ tenantId, schoolId }) {
  if (!tenantId) return { ...demo, providerConfigured: isProviderConfigured() };
  const [metrics, events] = await Promise.all([
    prisma.analyticsMetric.findMany({
      where: { tenantId, ...(schoolId ? { schoolId } : {}) },
      take: 12,
    }),
    prisma.securityEvent
      .count({ where: { tenantId, ...(schoolId ? { schoolId } : {}), status: 'OPEN' } })
      .catch(() => 0),
  ]);
  return {
    ...demo,
    providerConfigured: isProviderConfigured(),
    metrics,
    openSecurityEvents: events,
  };
}

export async function ask({ tenantId, schoolId, question }) {
  const context = JSON.stringify(await getOverview({ tenantId, schoolId }));
  return generateAdvisory({
    system: 'You are a school administration intelligence advisor.',
    prompt: `Question: ${question}\nEvidence: ${context}`,
  });
}
