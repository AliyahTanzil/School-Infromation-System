import { useCallback, useEffect, useMemo, useState } from 'react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const featureCatalog = [
  'ai_intelligence',
  'smart_identity',
  'iot_smart_school',
  'parent_portal',
  'advanced_analytics',
  'biometrics',
];

export default function TenantAdminDashboard() {
  const [view, setView] = useState('overview');
  const [tenants, setTenants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showSchoolCreate, setShowSchoolCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', timezone: 'UTC', currency: 'USD' });
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '', city: '', country: '' });

  const fail = (error, fallback) =>
    setMessage({ type: 'error', text: getApiErrorMessage(error, fallback) });
  const loadTenants = useCallback(async () => {
    const { data } = await api.get('/tenants');
    const items = data.data ?? [];
    setTenants(items);
    setSelectedId((current) => current || items[0]?.id || '');
  }, []);
  const loadDetails = useCallback(async (id) => {
    if (!id) return setDetails(null);
    const { data } = await api.get(`/tenants/${id}`);
    setDetails(data.data);
  }, []);

  useEffect(() => {
    loadTenants()
      .catch((error) => fail(error, 'Unable to load tenants'))
      .finally(() => setLoading(false));
  }, [loadTenants]);
  useEffect(() => {
    loadDetails(selectedId).catch((error) => fail(error, 'Unable to load tenant'));
  }, [loadDetails, selectedId]);

  const metrics = useMemo(
    () => ({
      tenants: tenants.length,
      schools: tenants.reduce((sum, item) => sum + (item.counts?.schools ?? 0), 0),
      users: tenants.reduce((sum, item) => sum + (item.counts?.users ?? 0), 0),
      suspended: tenants.filter((item) => item.status === 'SUSPENDED').length,
    }),
    [tenants]
  );
  const visibleTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        const needle = query.trim().toLowerCase();
        return (
          (statusFilter === 'ALL' || tenant.status === statusFilter) &&
          (!needle || `${tenant.name} ${tenant.code}`.toLowerCase().includes(needle))
        );
      }),
    [query, statusFilter, tenants]
  );
  const featureState = new Map((details?.features ?? []).map((item) => [item.key, item.enabled]));
  const audit = (details?.audit ?? []).filter(
    (item) => auditFilter === 'ALL' || item.action === auditFilter
  );

  const refresh = async (text) => {
    await loadTenants();
    await loadDetails(selectedId);
    setMessage({ type: 'success', text });
  };
  const createTenant = async (event) => {
    event.preventDefault();
    setBusy('create');
    try {
      const { data } = await api.post('/tenants', form);
      setSelectedId(data.data.id);
      setShowCreate(false);
      setForm({ name: '', code: '', timezone: 'UTC', currency: 'USD' });
      await loadTenants();
      setMessage({ type: 'success', text: 'Tenant created in pending status.' });
    } catch (error) {
      fail(error, 'Unable to create tenant');
    } finally {
      setBusy('');
    }
  };
  const changeStatus = async (status) => {
    if (!details) return;
    if (
      ['SUSPENDED', 'ARCHIVED'].includes(status) &&
      !window.confirm(`Confirm ${status.toLowerCase()} for ${details.name}?`)
    )
      return;
    setBusy(status);
    try {
      await api.post(`/tenants/${details.id}/status`, { status });
      await refresh(`Tenant changed to ${status}.`);
    } catch (error) {
      fail(error, 'Unable to change tenant status');
    } finally {
      setBusy('');
    }
  };
  const toggleFeature = async (key, enabled) => {
    if (!details) return;
    setBusy(key);
    try {
      await api.put(`/tenants/${details.id}/features/${key}`, { enabled });
      await loadDetails(details.id);
      setMessage({ type: 'success', text: `${key.replaceAll('_', ' ')} updated.` });
    } catch (error) {
      fail(error, 'Unable to update feature');
    } finally {
      setBusy('');
    }
  };
  const createSchool = async (event) => {
    event.preventDefault();
    if (!details) return;
    setBusy('school');
    try {
      await api.post(`/tenants/${details.id}/schools`, schoolForm);
      setSchoolForm({ name: '', code: '', city: '', country: '' });
      setShowSchoolCreate(false);
      await refresh('School provisioned and added to the tenant audit history.');
    } catch (error) {
      fail(error, 'Unable to create school');
    } finally {
      setBusy('');
    }
  };

  if (loading)
    return (
      <main className="tenant-admin-page">
        <p>Loading tenant controls…</p>
      </main>
    );
  return (
    <main className="tenant-admin-page">
      <header className="tenant-admin-hero">
        <div>
          <p className="tenant-kicker">Platform operations / tenant control</p>
          <h1>Run every school from one tenant boundary.</h1>
          <p>
            Provision schools, enforce lifecycle safeguards, control entitlements, and review
            immutable activity.
          </p>
        </div>
        <span className="tenant-status">● {details?.status ?? 'NO TENANT'}</span>
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
      {message.text && (
        <div
          className={message.type === 'error' ? 'tenant-error' : 'tenant-notice'}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>Dismiss</button>
        </div>
      )}

      {view === 'overview' && (
        <>
          <section className="tenant-metrics">
            {[
              [metrics.tenants, 'Tenants'],
              [metrics.schools, 'Schools'],
              [metrics.users, 'Users'],
              [metrics.suspended, 'Suspended'],
            ].map(([value, label]) => (
              <article key={label}>
                <strong>{value.toLocaleString()}</strong>
                <span>{label}</span>
              </article>
            ))}
          </section>
          <section className="tenant-grid">
            <article className="tenant-panel">
              <div className="tenant-panel-heading">
                <div>
                  <p className="tenant-eyebrow">Selected tenant</p>
                  <h2>{details?.name ?? 'Select a tenant'}</h2>
                </div>
                <span>{details?.code}</span>
              </div>
              {details && (
                <div className="tenant-detail-grid">
                  {[
                    ['Status', details.status],
                    ['Timezone', details.timezone],
                    ['Currency', details.currency],
                    ['Schools', details.counts?.schools ?? 0],
                    ['Students', details.counts?.students ?? 0],
                    ['Users', details.counts?.users ?? 0],
                  ].map(([label, value]) => (
                    <span key={label}>
                      {label}
                      <b>{value}</b>
                    </span>
                  ))}
                </div>
              )}
            </article>
            <article className="tenant-panel">
              <p className="tenant-eyebrow">Lifecycle safeguards</p>
              <h2>Authorized status controls</h2>
              <div className="tenant-actions">
                {details?.status !== 'ACTIVE' && (
                  <button onClick={() => changeStatus('ACTIVE')} disabled={busy}>
                    Activate / reactivate
                  </button>
                )}
                {details?.status === 'ACTIVE' && (
                  <button onClick={() => changeStatus('SUSPENDED')} disabled={busy}>
                    Suspend
                  </button>
                )}
                {details?.status !== 'ARCHIVED' && (
                  <button
                    className="danger"
                    onClick={() => changeStatus('ARCHIVED')}
                    disabled={busy}
                  >
                    Archive
                  </button>
                )}
              </div>
              <p className="tenant-help">
                Important lifecycle and entitlement changes are validated server-side and audited.
              </p>
            </article>
          </section>
        </>
      )}

      {view === 'schools' && (
        <section className="tenant-panel tenant-wide">
          <div className="tenant-panel-heading">
            <div>
              <p className="tenant-eyebrow">Tenant directory</p>
              <h2>Search, provision, and inspect tenants</h2>
            </div>
            <button className="tenant-action" onClick={() => setShowCreate(!showCreate)}>
              Add tenant
            </button>
          </div>
          {showCreate && (
            <form className="tenant-create-form" onSubmit={createTenant}>
              <input
                required
                placeholder="Tenant name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                placeholder="Unique code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <input
                placeholder="Timezone"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
              <input
                placeholder="Currency"
                maxLength="3"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              />
              <button disabled={busy === 'create'}>
                {busy === 'create' ? 'Creating…' : 'Create pending tenant'}
              </button>
            </form>
          )}
          <div className="tenant-filters">
            <input
              type="search"
              placeholder="Search name or code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="school-list">
            {visibleTenants.map((tenant) => (
              <button
                className={tenant.id === selectedId ? 'selected' : ''}
                key={tenant.id}
                onClick={() => setSelectedId(tenant.id)}
              >
                <div>
                  <strong>{tenant.name}</strong>
                  <span>
                    {tenant.code} · {tenant.counts?.schools ?? 0} schools ·{' '}
                    {tenant.counts?.users ?? 0} users
                  </span>
                </div>
                <b className={tenant.status === 'ACTIVE' ? 'on' : ''}>{tenant.status}</b>
              </button>
            ))}
          </div>
          {details && (
            <div className="tenant-school-section">
              <div className="tenant-panel-heading">
                <div>
                  <p className="tenant-eyebrow">Schools in {details.name}</p>
                  <h2>Provisioned schools</h2>
                </div>
                <button
                  className="tenant-action"
                  onClick={() => setShowSchoolCreate(!showSchoolCreate)}
                >
                  Add school
                </button>
              </div>
              {showSchoolCreate && (
                <form className="tenant-create-form" onSubmit={createSchool}>
                  <input
                    required
                    placeholder="School name"
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  />
                  <input
                    required
                    placeholder="School code"
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  />
                  <input
                    placeholder="City"
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                  />
                  <input
                    placeholder="Country"
                    value={schoolForm.country}
                    onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })}
                  />
                  <button disabled={busy === 'school'}>
                    {busy === 'school' ? 'Provisioning…' : 'Create school'}
                  </button>
                </form>
              )}
              <div className="school-list">
                {(details.schools ?? []).map((school) => (
                  <div key={school.id}>
                    <div>
                      <strong>{school.name}</strong>
                      <span>
                        {school.code}
                        {school.city ? ` · ${school.city}` : ''}
                        {school.country ? ` · ${school.country}` : ''}
                      </span>
                    </div>
                    <b className="on">PROVISIONED</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'features' && (
        <section className="tenant-panel tenant-wide">
          <p className="tenant-eyebrow">Feature entitlements</p>
          <h2>Control services for {details?.name ?? 'the selected tenant'}</h2>
          <p className="tenant-help">
            Tenant entitlements are persisted and audited. Plan pricing and billing remain in
            Subscription & billing.
          </p>
          <div className="feature-list feature-list-large">
            {featureCatalog.map((key) => {
              const enabled = featureState.get(key) ?? false;
              return (
                <div key={key}>
                  <span>
                    <strong>{key.replaceAll('_', ' ')}</strong>
                    <small>{key}</small>
                  </span>
                  <button
                    disabled={!details || busy === key}
                    className={enabled ? 'toggle on' : 'toggle'}
                    onClick={() => toggleFeature(key, !enabled)}
                    aria-pressed={enabled}
                  >
                    {enabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {view === 'audit' && (
        <section className="tenant-panel tenant-wide">
          <div className="tenant-panel-heading">
            <div>
              <p className="tenant-eyebrow">Platform audit</p>
              <h2>Immutable tenant activity</h2>
            </div>
            <select value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)}>
              {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'].map((action) => (
                <option key={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="audit-list">
            {audit.length ? (
              audit.map((event) => (
                <div key={event.id}>
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                  <strong>
                    {event.action} {event.entityType}
                  </strong>
                  <small>
                    {event.actor}
                    {event.metadata ? ` · ${JSON.stringify(event.metadata)}` : ''}
                  </small>
                </div>
              ))
            ) : (
              <p className="tenant-help">No matching audit events for this tenant.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
