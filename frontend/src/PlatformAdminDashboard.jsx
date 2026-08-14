import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Archive, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from './api/auth.js';

export default function PlatformAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/platform-admin/overview')
      .then(({ data }) => active && setOverview(data.data ?? data))
      .catch(
        (err) => active && setError(err.response?.data?.error ?? 'Platform overview unavailable')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const queueAction = async (label, targetId) => {
    try {
      const { data } = await api.post('/platform-admin/actions', {
        action: 'schedule-maintenance',
        targetId,
      });
      setNotice(data.message ?? `${label} recorded.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Platform action failed');
    }
  };

  if (loading)
    return (
      <main className="platform-page">
        <p>Loading platform operations…</p>
      </main>
    );
  if (error)
    return (
      <main className="platform-page">
        <div className="platform-notice" role="alert">
          {error}
        </div>
      </main>
    );
  const summary = overview?.summary ?? {};
  const services = overview?.services ?? [];

  return (
    <main className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="eyebrow">PLATFORM OPERATIONS / MODULE 45</p>
          <h1>Control the whole school network.</h1>
          <p>
            Platform administration keeps tenants healthy, services observable, and sensitive
            actions accountable.
          </p>
        </div>
        <div className="platform-status">
          <CheckCircle2 size={18} />
          <span>Operational data loaded</span>
        </div>
      </header>
      {notice && (
        <div className="platform-notice" role="status">
          {notice}
        </div>
      )}
      <section className="platform-metrics">
        {[
          [summary.tenants, 'Tenants'],
          [summary.schools, 'Schools'],
          [summary.activeUsers, 'Active users'],
          [summary.openIncidents, 'Open incident'],
        ].map(([value, label]) => (
          <article key={label}>
            <strong>{value ?? '—'}</strong>
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
            {services.map((service) => (
              <div className="service-row" key={service.key}>
                <span className={`health-dot ${service.status === 'DEGRADED' ? 'degraded' : ''}`} />
                <div>
                  <strong>{service.name}</strong>
                  <small>{service.latencyMs}ms latency</small>
                </div>
                <b>{service.uptimePercent}%</b>
                <span className="service-state">{service.status}</span>
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
            {(overview?.security ?? []).map((item) => (
              <li key={item.event}>
                <AlertTriangle size={16} />
                <span>
                  {item.event}
                  <small>
                    {item.time} · {item.severity}
                  </small>
                </span>
              </li>
            ))}
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
          {(overview?.backups ?? []).map((backup) => (
            <div className="stacked-detail" key={backup.scope}>
              <strong>{backup.scope}</strong>
              <span>
                {backup.status} · {backup.size}
              </span>
              <small>{backup.completedAt}</small>
            </div>
          ))}
          <button onClick={() => queueAction('Backup verification', 'backup-verification')}>
            Record maintenance review
          </button>
        </article>
      </section>
    </main>
  );
}
