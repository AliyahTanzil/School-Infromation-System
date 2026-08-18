import { useMemo, useState } from 'react';

const demo = {
  tenant: {
    name: 'Northstar Education Group',
    slug: 'northstar',
    plan: 'Enterprise',
    status: 'ACTIVE',
  },
  schools: [
    { name: 'Northstar Academy', code: 'NSA', status: 'ACTIVE', students: 1248 },
    { name: 'Northstar Primary', code: 'NSP', status: 'ACTIVE', students: 684 },
    { name: 'Lakeside Sixth Form', code: 'LSF', status: 'PROVISIONING', students: 312 },
  ],
  usage: [
    { label: 'Active users', value: 2841, limit: 5000 },
    { label: 'Storage', value: 68, limit: 100 },
    { label: 'API calls', value: 74200, limit: 100000 },
  ],
  flags: [
    { key: 'ai_intelligence', enabled: true },
    { key: 'smart_identity', enabled: true },
    { key: 'iot_smart_school', enabled: true },
    { key: 'parent_portal', enabled: false },
  ],
  audit: [
    { action: 'Feature enabled', entity: 'ai_intelligence', time: '18 minutes ago' },
    { action: 'School provisioned', entity: 'Lakeside Sixth Form', time: '2 hours ago' },
    { action: 'Export completed', entity: 'Tenant usage report', time: 'Yesterday' },
  ],
};

export default function TenantAdminDashboard() {
  const [view, setView] = useState('overview');
  const [flags, setFlags] = useState(demo.flags);
  const [exported, setExported] = useState(false);
  const totalStudents = useMemo(
    () => demo.schools.reduce((sum, school) => sum + school.students, 0),
    []
  );
  return (
    <main className="tenant-admin-page">
      <header className="tenant-admin-hero">
        <div>
          <p className="tenant-kicker">Platform operations / tenant control</p>
          <h1>Run every school from one tenant boundary.</h1>
          <p>
            Provisioned services, usage guardrails, and lifecycle controls for Northstar Education
            Group.
          </p>
        </div>
        <span className="tenant-status">● {demo.tenant.status}</span>
      </header>
      <nav className="tenant-tabs" aria-label="Tenant views">
        {['overview', 'schools', 'features', 'audit'].map((item) => (
          <button
            key={item}
            className={view === item ? 'active' : ''}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      {view === 'overview' && (
        <>
          <section className="tenant-metrics">
            {[
              ['3', 'Schools'],
              [totalStudents.toLocaleString(), 'Students'],
              ['2,841', 'Active users'],
              ['Enterprise', 'Plan'],
            ].map(([value, label]) => (
              <article key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </section>
          <section className="tenant-grid">
            <article className="tenant-panel">
              <div className="tenant-panel-heading">
                <div>
                  <p className="tenant-eyebrow">Usage guardrails</p>
                  <h2>Capacity this cycle</h2>
                </div>
                <span>Live</span>
              </div>
              {demo.usage.map((item) => (
                <div className="usage-row" key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <b>
                      {typeof item.value === 'number' && item.value > 1000
                        ? item.value.toLocaleString()
                        : `${item.value}%`}
                    </b>
                  </div>
                  <div className="usage-track">
                    <i style={{ width: `${Math.min((item.value / item.limit) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </article>
            <article className="tenant-panel">
              <div className="tenant-panel-heading">
                <div>
                  <p className="tenant-eyebrow">Feature control</p>
                  <h2>Available services</h2>
                </div>
                <span>{flags.filter((flag) => flag.enabled).length}/4 on</span>
              </div>
              <div className="feature-list">
                {flags.map((flag) => (
                  <div key={flag.key}>
                    <span>{flag.key.replaceAll('_', ' ')}</span>
                    <b className={flag.enabled ? 'on' : ''}>{flag.enabled ? 'Enabled' : 'Off'}</b>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
      {view === 'schools' && (
        <section className="tenant-panel tenant-wide">
          <div className="tenant-panel-heading">
            <div>
              <p className="tenant-eyebrow">Tenant directory</p>
              <h2>Schools and provisioning</h2>
            </div>
            <button className="tenant-action" onClick={() => setExported(true)}>
              Export directory
            </button>
            {exported && (
              <span role="status" className="tenant-feedback">
                Directory export is ready.
              </span>
            )}
          </div>
          <div className="school-list">
            {demo.schools.map((school) => (
              <div key={school.code}>
                <div>
                  <strong>{school.name}</strong>
                  <span>
                    {school.code} · {school.students.toLocaleString()} students
                  </span>
                </div>
                <b className={school.status === 'ACTIVE' ? 'on' : ''}>{school.status}</b>
              </div>
            ))}
          </div>
        </section>
      )}
      {view === 'features' && (
        <section className="tenant-panel tenant-wide">
          <p className="tenant-eyebrow">Feature flags</p>
          <h2>Control the tenant experience</h2>
          <div className="feature-list feature-list-large">
            {flags.map((flag) => (
              <div key={flag.key}>
                <span>{flag.key.replaceAll('_', ' ')}</span>
                <button
                  className={flag.enabled ? 'toggle on' : 'toggle'}
                  onClick={() =>
                    setFlags((current) =>
                      current.map((item) =>
                        item.key === flag.key ? { ...item, enabled: !item.enabled } : item
                      )
                    )
                  }
                  aria-pressed={flag.enabled}
                >
                  {flag.enabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {view === 'audit' && (
        <section className="tenant-panel tenant-wide">
          <p className="tenant-eyebrow">Platform audit</p>
          <h2>Recent tenant activity</h2>
          <div className="audit-list">
            {demo.audit.map((event) => (
              <div key={event.entity}>
                <span>{event.time}</span>
                <strong>{event.action}</strong>
                <small>{event.entity}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
