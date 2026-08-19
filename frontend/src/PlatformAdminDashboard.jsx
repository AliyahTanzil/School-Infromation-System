import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  FileClock,
  Gauge,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Users,
} from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'operations', label: 'Operations' },
  { key: 'security', label: 'Security' },
  { key: 'governance', label: 'Governance' },
];

const linkedModules = [
  ['/tenant-admin', 'Tenant administration', 'Schools, quotas, feature flags, and lifecycle controls.'],
  ['/users', 'User management', 'Accounts, roles, permissions, and access reviews.'],
  ['/security-admin', 'Security & compliance', 'MFA, sessions, privacy requests, and evidence.'],
  ['/billing', 'Subscription & billing', 'Plans, entitlements, invoices, and usage.'],
  ['/integrations', 'Integrations', 'Provider health, sync safeguards, and connections.'],
  ['/analytics', 'Analytics & BI', 'Executive trends, reports, exports, and signals.'],
];

function formatDate(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function PlatformAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState('');

  const loadOverview = async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await api.get('/platform-admin/overview');
      setOverview(data.data ?? data);
      if (isRefresh) setNotice('Operational data refreshed.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Platform overview unavailable'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOverview(); }, []);

  const queueAction = async (label, action, targetId) => {
    setActionId(targetId);
    setError('');
    try {
      const { data } = await api.post('/platform-admin/actions', { action, targetId });
      setNotice(data.message ?? `${label} recorded.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Platform action failed'));
    } finally {
      setActionId('');
    }
  };

  const summary = overview?.summary ?? {};
  const services = overview?.services ?? [];
  const incidents = overview?.incidents ?? [];
  const backups = overview?.backups ?? [];
  const integrations = overview?.integrations ?? [];
  const security = overview?.security ?? [];
  const operationalServices = useMemo(() => services.filter((service) => service.status === 'OPERATIONAL').length, [services]);

  if (loading) return <main className="platform-page"><div className="platform-loading"><RefreshCw className="spin" size={20} />Loading platform operations…</div></main>;
  if (error && !overview) return <main className="platform-page"><div className="platform-notice" role="alert">{error}<button onClick={() => loadOverview()}>Retry</button></div></main>;

  return (
    <main className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="eyebrow">PLATFORM OPERATIONS / MODULE 45</p>
          <h1>Control the whole school network.</h1>
          <p>Platform administration keeps tenants healthy, services observable, and sensitive actions accountable.</p>
        </div>
        <div className="platform-hero-actions">
          <div className="platform-status"><CheckCircle2 size={18} /><span>Operational data loaded</span></div>
          <button className="platform-refresh" onClick={() => loadOverview(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh</button>
        </div>
      </header>

      <nav className="platform-tabs" aria-label="Platform administration views">
        {navItems.map((item) => <button key={item.key} className={activeView === item.key ? 'active' : ''} onClick={() => setActiveView(item.key)}>{item.label}</button>)}
      </nav>
      {notice && <div className="platform-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>Dismiss</button></div>}
      {error && <div className="platform-error" role="alert">{error}</div>}

      <section className="platform-metrics" aria-label="Platform summary">
        {[[summary.tenants, 'Tenants', Users], [summary.schools, 'Schools', ServerCog], [summary.activeUsers, 'Active users', Gauge], [summary.openIncidents, 'Open incidents', AlertTriangle]].map(([value, label, Icon]) => <article key={label}><Icon size={18} /><strong>{value ?? '—'}</strong><span>{label}</span></article>)}
      </section>

      {activeView === 'overview' && <>
        <section className="platform-grid">
          <article className="platform-panel platform-wide"><div className="panel-heading"><div><p className="eyebrow">SERVICE HEALTH</p><h2>Operational pulse</h2><span className="panel-caption">{operationalServices} of {services.length} services operational</span></div><Activity size={20} /></div><div className="service-list">{services.map((service) => <div className="service-row" key={service.key}><span className={`health-dot ${service.status === 'DEGRADED' ? 'degraded' : ''}`} /><div><strong>{service.name}</strong><small>{service.latencyMs}ms latency</small></div><b>{service.uptimePercent}%</b><span className="service-state">{service.status}</span></div>)}</div></article>
          <article className="platform-panel"><div className="panel-heading"><div><p className="eyebrow">SECURITY</p><h2>Recent events</h2></div><ShieldAlert size={20} /></div><ul className="event-list">{security.map((item) => <li key={item.event}><AlertTriangle size={16} /><span>{item.event}<small>{item.time} · {item.severity}</small></span></li>)}</ul><button onClick={() => setActiveView('security')}>Review security <ArrowRight size={14} /></button></article>
          <article className="platform-panel"><div className="panel-heading"><div><p className="eyebrow">RESILIENCE</p><h2>Backups & maintenance</h2></div><Archive size={20} /></div>{backups.map((backup) => <div className="stacked-detail" key={backup.scope}><strong>{backup.scope}</strong><span>{backup.status} · {backup.size}</span><small>{backup.completedAt}</small></div>)}<button onClick={() => queueAction('Backup verification', 'schedule-maintenance', 'backup-verification')} disabled={actionId === 'backup-verification'}>{actionId === 'backup-verification' ? 'Recording…' : 'Record maintenance review'}</button></article>
        </section>
        <section className="platform-panel platform-launchpad"><div className="panel-heading"><div><p className="eyebrow">ADMIN CONTROL CENTER</p><h2>Open an operational workspace</h2></div><ExternalLink size={20} /></div><div className="module-links">{linkedModules.map(([href, title, description]) => <Link to={href} key={href}><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={16} /></Link>)}</div></section>
      </>}

      {activeView === 'operations' && <section className="platform-grid"><article className="platform-panel platform-wide"><div className="panel-heading"><div><p className="eyebrow">OPERATIONS</p><h2>Incidents and maintenance</h2></div><FileClock size={20} /></div>{incidents.map((incident) => <div className="incident-card" key={incident.id}><div><span className="severity-badge">{incident.severity}</span><h3>{incident.title}</h3><p>{incident.service} · Started {formatDate(incident.startedAt)}</p></div><button onClick={() => queueAction('Incident acknowledgement', 'acknowledge-incident', incident.id)} disabled={actionId === incident.id}>{actionId === incident.id ? 'Recording…' : 'Acknowledge incident'}</button></div>)}{(overview?.maintenance ?? []).map((item) => <div className="stacked-detail" key={item.title}><strong>{item.title}</strong><span>{item.scope}</span><small>{formatDate(item.startsAt)} – {formatDate(item.endsAt)}</small></div>)}</article><article className="platform-panel"><div className="panel-heading"><div><p className="eyebrow">DATA PLANE</p><h2>Service inventory</h2></div><Database size={20} /></div>{services.map((service) => <div className="compact-row" key={service.key}><span>{service.name}</span><b>{service.status}</b></div>)}</article></section>}

      {activeView === 'security' && <section className="platform-panel"><div className="panel-heading"><div><p className="eyebrow">SECURITY OPERATIONS</p><h2>Events requiring owner oversight</h2></div><ShieldAlert size={20} /></div><div className="security-grid">{security.map((item) => <div className="security-card" key={item.event}><AlertTriangle size={17} /><div><strong>{item.event}</strong><p>{item.time} · {item.severity}</p></div></div>)}</div><Link className="platform-inline-link" to="/security-admin">Open advanced security <ArrowRight size={14} /></Link></section>}

      {activeView === 'governance' && <section className="platform-grid"><article className="platform-panel platform-wide"><div className="panel-heading"><div><p className="eyebrow">GOVERNANCE</p><h2>Connected platform services</h2></div><ServerCog size={20} /></div>{integrations.map((item) => <div className="compact-row" key={item.name}><span>{item.name}</span><b className={item.status === 'SANDBOX' ? 'warning-text' : ''}>{item.status}</b></div>)}<Link className="platform-inline-link" to="/integrations">Manage integrations <ArrowRight size={14} /></Link></article><article className="platform-panel"><div className="panel-heading"><div><p className="eyebrow">AUDIT</p><h2>Every sensitive action is recorded</h2></div><FileClock size={20} /></div><p className="panel-copy">Owner operations create auditable records for review. Continue to the security workspace for retention, evidence, and access controls.</p><Link className="platform-inline-link" to="/security">Open audit trails <ArrowRight size={14} /></Link></article></section>}
    </main>
  );
}
