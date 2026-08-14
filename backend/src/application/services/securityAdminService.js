import crypto from 'node:crypto';

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const demo = {
  posture: { score: 92, label: 'Strong', mfaCoverage: 86, activeSessions: 124, openAlerts: 3 },
  policies: [
    {
      key: 'mfa-required',
      title: 'MFA for privileged roles',
      status: 'ACTIVE',
      scope: 'Platform + tenant admins',
    },
    {
      key: 'session-risk',
      title: 'Adaptive session controls',
      status: 'ACTIVE',
      scope: 'All users',
    },
    { key: 'retention', title: 'Student record retention', status: 'ACTIVE', scope: 'All schools' },
  ],
  threats: [
    {
      title: 'Repeated failed sign-ins',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      time: '12 min ago',
    },
    {
      title: 'Unusual export volume',
      severity: 'MEDIUM',
      status: 'ACKNOWLEDGED',
      time: '1 hr ago',
    },
    { title: 'Stale admin session', severity: 'LOW', status: 'RESOLVED', time: '3 hrs ago' },
  ],
  controls: [
    { framework: 'FERPA', key: 'AC-02', title: 'Account management', status: 'EVIDENCE READY' },
    { framework: 'SOC 2', key: 'CC6.1', title: 'Logical access controls', status: 'REVIEW DUE' },
    { framework: 'GDPR', key: 'ART-17', title: 'Erasure requests', status: 'COMPLIANT' },
  ],
  sessions: { privileged: 18, revokedToday: 4, expiringSoon: 7 },
};

export function getSecurityOverview({ actor }) {
  if (!actor) throw new Error('UNAUTHENTICATED');
  return { ...demo, scope: actor.platformAdmin ? 'platform' : 'tenant' };
}

export function evaluateRisk({ eventType, failedAttempts = 0, ip }) {
  const score = Math.min(100, failedAttempts * 18 + (eventType === 'EXPORT_SPIKE' ? 35 : 0));
  const level = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
  return { score, level, ipHash: ip ? hash(ip) : undefined };
}

export function revokeSession({ sessionId, actor }) {
  if (!actor) throw new Error('UNAUTHENTICATED');
  if (!sessionId) throw new Error('INVALID_SESSION');
  return { sessionId, status: 'REVOKED', audited: true };
}
