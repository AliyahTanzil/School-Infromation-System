import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';

const policies = [
  ['MFA for privileged roles', 'ACTIVE', 'Platform + tenant admins'],
  ['Adaptive session controls', 'ACTIVE', 'All users'],
  ['Student record retention', 'ACTIVE', 'All schools'],
];
const threats = [
  ['Repeated failed sign-ins', 'HIGH', 'INVESTIGATING', '12 min ago'],
  ['Unusual export volume', 'MEDIUM', 'ACKNOWLEDGED', '1 hr ago'],
  ['Stale admin session', 'LOW', 'RESOLVED', '3 hrs ago'],
];
const controls = [
  ['FERPA', 'AC-02', 'Account management', 'EVIDENCE READY'],
  ['SOC 2', 'CC6.1', 'Logical access controls', 'REVIEW DUE'],
  ['GDPR', 'ART-17', 'Erasure requests', 'COMPLIANT'],
];

export default function SecurityAdminDashboard() {
  const [message, setMessage] = useState('');
  return (
    <main className="security-admin-page">
      <header className="security-admin-hero">
        <div>
          <p className="eyebrow">Module 34 · Security administration</p>
          <h1>Trust is an operating system.</h1>
          <p>
            Protect every learner, staff member, and school with policy-led access, risk signals,
            and evidence-ready controls.
          </p>
        </div>
        <div className="posture-score">
          <ShieldCheck size={18} />
          <strong>92</strong>
          <span>Strong posture</span>
        </div>
      </header>
      <section className="security-metrics">
        <article>
          <LockKeyhole />
          <strong>86%</strong>
          <span>MFA coverage</span>
        </article>
        <article>
          <Activity />
          <strong>124</strong>
          <span>Active sessions</span>
        </article>
        <article>
          <AlertTriangle />
          <strong>3</strong>
          <span>Open alerts</span>
        </article>
        <article>
          <UserRoundX />
          <strong>4</strong>
          <span>Revoked today</span>
        </article>
      </section>
      <section className="security-grid">
        <article className="security-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Policy center</p>
              <h2>Controls in force</h2>
            </div>
            <CheckCircle2 />
          </div>
          {policies.map(([title, status, scope]) => (
            <div className="security-row" key={title}>
              <div>
                <strong>{title}</strong>
                <span>{scope}</span>
              </div>
              <b className="status-ok">{status}</b>
            </div>
          ))}
        </article>
        <article className="security-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Risk signals</p>
              <h2>Threat activity</h2>
            </div>
            <AlertTriangle />
          </div>
          {threats.map(([title, severity, status, time]) => (
            <div className="security-row" key={title}>
              <div>
                <strong>{title}</strong>
                <span>
                  {time} · {status}
                </span>
              </div>
              <b className={`risk-${severity.toLowerCase()}`}>{severity}</b>
            </div>
          ))}
        </article>
      </section>
      <section className="security-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Compliance evidence</p>
            <h2>Evidence readiness</h2>
          </div>
          <button onClick={() => setMessage('Evidence export queued for review.')}>
            Export evidence
          </button>
        </div>
        <div className="control-grid">
          {controls.map(([framework, key, title, status]) => (
            <div className="control-card" key={key}>
              <span>
                {framework} · {key}
              </span>
              <strong>{title}</strong>
              <b>{status}</b>
            </div>
          ))}
        </div>
        {message && (
          <p className="security-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
