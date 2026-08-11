import { useState } from 'react';
import { Activity, AlertTriangle, Archive, CheckCircle2, ShieldAlert } from 'lucide-react';

const services = [
  ['Core API', 'OPERATIONAL', '84ms', '99.98%'],
  ['Primary database', 'OPERATIONAL', '41ms', '99.99%'],
  ['Notification delivery', 'DEGRADED', '312ms', '99.72%'],
  ['Document storage', 'OPERATIONAL', '116ms', '99.95%'],
];

export default function PlatformAdminDashboard() {
  const [notice, setNotice] = useState('');
  const queueAction = (label) => setNotice(`${label} queued for audited review in Demo mode.`);
  return (
    <main className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="eyebrow">PLATFORM OPERATIONS / MODULE 33</p>
          <h1>Control the whole school network.</h1>
          <p>
            Platform administration keeps tenants healthy, services observable, and sensitive
            actions accountable.
          </p>
        </div>
        <div className="platform-status">
          <CheckCircle2 size={18} />
          <span>All core systems operational</span>
        </div>
      </header>
      {notice && (
        <div className="platform-notice" role="status">
          {notice}
        </div>
      )}
      <section className="platform-metrics">
        {[
          ['18', 'Tenants'],
          ['42', 'Schools'],
          ['12,840', 'Active users'],
          ['1', 'Open incident'],
        ].map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>
      <section className="platform-grid">
        <article className="platform-panel platform-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SERVICE HEALTH</p>
              <h2>Operational pulse</h2>
            </div>
            <Activity size={20} />
          </div>
          <div className="service-list">
            {services.map(([name, status, latency, uptime]) => (
              <div className="service-row" key={name}>
                <span className={`health-dot ${status === 'DEGRADED' ? 'degraded' : ''}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{latency} latency</small>
                </div>
                <b>{uptime}</b>
                <span className="service-state">{status}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="platform-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SECURITY</p>
              <h2>Recent events</h2>
            </div>
            <ShieldAlert size={20} />
          </div>
          <ul className="event-list">
            <li>
              <AlertTriangle size={16} />
              <span>
                Blocked repeated login attempts<small>18 min ago · warning</small>
              </span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>
                Admin policy updated<small>46 min ago · info</small>
              </span>
            </li>
          </ul>
        </article>
        <article className="platform-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RESILIENCE</p>
              <h2>Backups & maintenance</h2>
            </div>
            <Archive size={20} />
          </div>
          <div className="stacked-detail">
            <strong>Production PostgreSQL</strong>
            <span>Verified · 8.4 GB</span>
            <small>Last completed today at 03:15</small>
          </div>
          <div className="stacked-detail">
            <strong>Database index maintenance</strong>
            <span>Aug 14 · 02:00–02:30 UTC</span>
            <small>Primary database</small>
          </div>
          <button onClick={() => queueAction('Backup verification')}>Review controls</button>
        </article>
      </section>
    </main>
  );
}
