const MODES = new Set(['academic-coach', 'attendance-guide', 'family-communication']);
const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /reveal.*system prompt/i,
  /arbitrary sql/i,
  /bypass.*permission/i,
];

export const aiAcademicDemo = {
  usage: { requests: 12, limit: 40, resetLabel: 'Resets in 18 days' },
  evidence: [
    { label: 'Attendance trend', value: '94.8%', source: 'Attendance snapshots · Jan 2026' },
    { label: 'Intervention group', value: '18 learners', source: 'Student support register' },
  ],
  suggestions: [
    'Draft a family outreach plan',
    'Compare attendance by grade',
    'Suggest a low-risk intervention',
  ],
};

function sanitize(input = '') {
  return input.replace(/[<>]/g, '').trim().slice(0, 2000);
}

export function assessAcademicRequest({ tenantId, userId, mode, input }) {
  if (!tenantId || !userId) throw new Error('Tenant scope required');
  if (!MODES.has(mode)) throw new Error('Unsupported assistant mode');
  const clean = sanitize(input);
  const flagged = INJECTION_PATTERNS.some((pattern) => pattern.test(clean));
  if (!clean || flagged)
    return {
      status: 'REFUSED',
      reason: flagged
        ? 'Request contains unsafe instructions.'
        : 'Add an academic question to continue.',
    };
  return {
    status: 'COMPLETED',
    answer:
      'Based on the verified school signals, start with a small attendance check-in for the intervention group, then review progress after one week. I cannot make a high-stakes decision or infer a learner diagnosis.',
    uncertainty:
      'This is guidance, not a decision. Confirm the evidence with the responsible school team.',
    evidence: aiAcademicDemo.evidence,
    riskFlags: [],
    promptVersion: 'academic-safe-v1',
  };
}

export function getUsage({ tenantId, userId }) {
  if (!tenantId || !userId) throw new Error('Tenant scope required');
  return aiAcademicDemo.usage;
}
