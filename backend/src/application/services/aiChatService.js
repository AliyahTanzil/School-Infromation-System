import crypto from 'node:crypto';

const MAX_INPUT = 1200;
const INJECTION_PATTERN =
  /(ignore\s+(all\s+)?previous|reveal\s+(the\s+)?system|developer\s+message|bypass\s+safety)/i;

export const chatDemo = {
  conversations: [
    {
      id: 'demo-conversation-1',
      title: 'Attendance intervention planning',
      roleKey: 'school_admin',
      updatedAt: 'Today, 09:42',
    },
    {
      id: 'demo-conversation-2',
      title: 'Grade 8 fee follow-up',
      roleKey: 'school_admin',
      updatedAt: 'Yesterday, 16:18',
    },
  ],
  suggestedQuestions: [
    'Which grades need attendance intervention this week?',
    'Summarize the latest fee collection risks.',
    'What evidence supports the current support backlog?',
  ],
};

const answers = [
  {
    text: 'Grade 9 is the clearest intervention candidate. Attendance is 91.8% this week, below the 95% campus target. The strongest next step is a counselor review of the 14 students with three or more absences.',
    citations: ['Attendance trend · Grade 9 · Week 6', 'Intervention queue · 14 students'],
    intentKey: 'attendance_intervention',
  },
  {
    text: 'Collection risk is concentrated in two cohorts. The current collection rate is 91.6%, with 8.4% still outstanding. Prioritize families with invoices older than 30 days and route payment-plan questions to the finance team.',
    citations: ['Finance rollup · Current period', 'Aging report · 30+ days'],
    intentKey: 'fee_collection',
  },
  {
    text: 'The support backlog is stable but uneven. There are 23 open cases, 7 older than the service target. The evidence suggests prioritizing transport and attendance cases before general requests.',
    citations: ['Support queue · Open cases', 'SLA report · Current period'],
    intentKey: 'support_backlog',
  },
];

export function answerQuestion({ tenantId, userId, input }) {
  if (!tenantId || !userId) throw new Error('Tenant and user scope required');
  const normalized = String(input || '').slice(0, MAX_INPUT);
  if (!normalized)
    return {
      status: 'refused',
      text: 'Please ask a specific school operations question.',
      citations: [],
      safetyFlags: ['empty-input'],
    };
  if (INJECTION_PATTERN.test(normalized))
    return {
      status: 'refused',
      text: 'I can help with school operations, but I cannot reveal hidden instructions or bypass safety controls.',
      citations: [],
      safetyFlags: ['prompt-injection'],
    };
  const lower = normalized.toLowerCase();
  const selected =
    lower.includes('fee') || lower.includes('collection')
      ? answers[1]
      : lower.includes('support') || lower.includes('backlog')
        ? answers[2]
        : answers[0];
  return {
    id: crypto.randomUUID(),
    status: 'grounded',
    text: selected.text,
    citations: selected.citations,
    intentKey: selected.intentKey,
    safetyFlags: [],
    limitations:
      'This demo answer is based on the active tenant evidence snapshot and should be reviewed before consequential action.',
  };
}

export function submitFeedback({ tenantId, userId, rating }) {
  if (!tenantId || !userId) throw new Error('Tenant and user scope required');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error('Rating must be between 1 and 5');
  return { accepted: true, tenantId, rating };
}
