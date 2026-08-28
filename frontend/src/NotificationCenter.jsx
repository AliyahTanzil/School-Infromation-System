import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock3, Settings2, ShieldCheck } from 'lucide-react';
import api from './api/auth.js';

const channelLabels = {
  IN_APP: 'In-app inbox',
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push notification',
};
const defaults = { IN_APP: true, EMAIL: false, SMS: false, PUSH: false };
const errorText = (error, fallback) =>
  error.response?.data?.error?.message || error.response?.data?.message || fallback;
const contentOf = (delivery) => {
  const payload = delivery.event?.payload ?? {};
  return {
    title: payload.title || delivery.event?.eventType || 'Notification',
    body: payload.body || payload.message || 'No message was supplied.',
    priority: String(payload.priority || 'NORMAL').toUpperCase(),
    link: payload.link,
  };
};

export default function NotificationCenter() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [deliveries, setDeliveries] = useState([]);
  const [preferences, setPreferences] = useState(defaults);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('inbox');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const headers = useMemo(() => ({ 'x-school-id': schoolId }), [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setMessage('');
    try {
      const [inboxResponse, preferenceResponse] = await Promise.all([
        api.get('/communication/inbox', { headers }),
        api.get('/communication/notification-preferences', { headers }),
      ]);
      const inbox = inboxResponse.data.data ?? [];
      setDeliveries(inbox);
      setSelectedId((current) =>
        inbox.some((delivery) => delivery.id === current) ? current : (inbox[0]?.id ?? null)
      );
      setPreferences({
        ...defaults,
        ...Object.fromEntries(
          (preferenceResponse.data.data ?? []).map((item) => [item.channel, item.enabled])
        ),
      });
    } catch (error) {
      setMessage(errorText(error, 'Unable to load your notifications.'));
    } finally {
      setLoading(false);
    }
  }, [headers, schoolId]);

  useEffect(() => void load(), [load]);
  const unread = deliveries.filter((delivery) => delivery.status !== 'READ').length;
  const visible = deliveries.filter((delivery) => {
    const content = contentOf(delivery);
    return (
      filter === 'all' ||
      (filter === 'unread' && delivery.status !== 'READ') ||
      (filter === 'high' && content.priority === 'HIGH')
    );
  });
  const selected = deliveries.find((delivery) => delivery.id === selectedId) ?? null;
  const totals = useMemo(
    () =>
      deliveries.reduce(
        (result, item) => ({ ...result, [item.status]: (result[item.status] ?? 0) + 1 }),
        {}
      ),
    [deliveries]
  );

  const markRead = async (delivery) => {
    if (!delivery || delivery.status === 'READ') return;
    try {
      await api.post(`/communication/notifications/${delivery.eventId}/read`, {}, { headers });
      setDeliveries((items) =>
        items.map((item) =>
          item.eventId === delivery.eventId ? { ...item, status: 'READ' } : item
        )
      );
      setMessage('Notification marked as read.');
    } catch (error) {
      setMessage(errorText(error, 'Unable to mark the notification as read.'));
    }
  };

  const savePreference = async (channel) => {
    const enabled = !preferences[channel];
    try {
      await api.put('/communication/notification-preferences', { channel, enabled }, { headers });
      setPreferences((current) => ({ ...current, [channel]: enabled }));
      setMessage(`${channelLabels[channel]} preference updated.`);
    } catch (error) {
      setMessage(errorText(error, 'Unable to save this preference.'));
    }
  };

  return (
    <main className="notification-shell">
      <Link to="/admin" className="notification-ghost">
        ← Back to administration
      </Link>
      <header className="notification-header">
        <div>
          <p className="eyebrow">Module 51.13 · Communication</p>
          <h1>Notification center</h1>
          <p>Review messages delivered to your account and control each delivery channel.</p>
        </div>
        <span className="privacy-chip">
          <ShieldCheck size={14} /> Private to you
        </span>
      </header>

      <section className="preference-card">
        <label>
          School context
          <input
            value={schoolId}
            placeholder="School UUID"
            onChange={(event) => {
              const value = event.target.value.trim();
              setSchoolId(value);
              sessionStorage.setItem('schoolId', value);
            }}
          />
        </label>
        {!schoolId && <p>Enter the school UUID used by your current administration workspace.</p>}
      </section>
      {message && (
        <p role="status" className="notification-toast">
          {message}
        </p>
      )}

      <nav className="notification-tabs">
        <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>
          <Bell size={15} /> Inbox {unread > 0 && <b>{unread}</b>}
        </button>
        <button
          className={tab === 'preferences' ? 'active' : ''}
          onClick={() => setTab('preferences')}
        >
          <Settings2 size={15} /> Preferences
        </button>
        <button className={tab === 'health' ? 'active' : ''} onClick={() => setTab('health')}>
          <CheckCheck size={15} /> My delivery status
        </button>
      </nav>

      {tab === 'inbox' && (
        <section className="notification-layout">
          <aside className="notification-list-panel">
            <div className="notification-list-heading">
              <div>
                <span className="section-kicker">Your inbox</span>
                <h2>Recent notifications</h2>
              </div>
            </div>
            <div className="notification-filter-row">
              {['all', 'unread', 'high'].map((value) => (
                <button
                  key={value}
                  className={filter === value ? 'active' : ''}
                  onClick={() => setFilter(value)}
                >
                  {value === 'high' ? 'Priority' : value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <div className="notification-items">
              {visible.map((delivery) => {
                const content = contentOf(delivery);
                return (
                  <button
                    key={delivery.id}
                    className={`notification-item ${selectedId === delivery.id ? 'selected' : ''} ${delivery.status !== 'READ' ? 'unread' : ''}`}
                    onClick={() => setSelectedId(delivery.id)}
                  >
                    <span className="notification-icon mint">
                      <Bell size={15} />
                    </span>
                    <span className="notification-copy">
                      <strong>{content.title}</strong>
                      <span>{content.body}</span>
                      <small>
                        {new Date(delivery.createdAt).toLocaleString()} · {delivery.channel}
                      </small>
                    </span>
                  </button>
                );
              })}
              {!loading && !visible.length && <p>No notifications match this view.</p>}
              {loading && <p>Loading notifications…</p>}
            </div>
          </aside>
          <article className="notification-detail">
            {selected ? (
              <>
                <span
                  className={`priority-badge ${contentOf(selected).priority === 'HIGH' ? 'high' : ''}`}
                >
                  {contentOf(selected).priority} priority
                </span>
                <p className="section-kicker">
                  {selected.channel} · {selected.status}
                </p>
                <h2>{contentOf(selected).title}</h2>
                <p className="notification-message">{contentOf(selected).body}</p>
                <div className="notification-actions">
                  <button
                    className="notification-primary"
                    onClick={() => markRead(selected)}
                    disabled={selected.status === 'READ'}
                  >
                    <Check size={15} /> {selected.status === 'READ' ? 'Read' : 'Mark as read'}
                  </button>
                  {contentOf(selected).link && (
                    <Link className="notification-ghost" to={contentOf(selected).link}>
                      Open related page
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p>Select a notification to inspect it.</p>
            )}
          </article>
        </section>
      )}

      {tab === 'preferences' && (
        <section className="preferences-layout">
          <div className="preferences-main">
            <span className="section-kicker">Your account</span>
            <h2>Delivery preferences</h2>
            <div className="preference-card">
              {Object.entries(channelLabels).map(([channel, label]) => (
                <label className="preference-row" key={channel}>
                  <span>
                    <strong>{label}</strong>
                    <small>Enable or disable {label.toLowerCase()} delivery.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[channel]}
                    onChange={() => savePreference(channel)}
                    disabled={!schoolId}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'health' && (
        <section className="analytics-layout">
          <div className="analytics-hero">
            <div>
              <span className="section-kicker">Your inbox only</span>
              <h2>Delivery status</h2>
              <p>Counts are calculated from your persisted delivery records.</p>
            </div>
          </div>
          <div className="analytics-stats">
            <article>
              <span>Total</span>
              <strong>{deliveries.length}</strong>
            </article>
            <article>
              <span>Read</span>
              <strong>{totals.READ ?? 0}</strong>
            </article>
            <article>
              <span>Pending</span>
              <strong>{totals.PENDING ?? 0}</strong>
            </article>
            <article>
              <span>Failed</span>
              <strong>{totals.FAILED ?? 0}</strong>
            </article>
          </div>
          <p>
            <Clock3 size={14} /> External email, SMS, and push messages remain queued until a
            provider adapter processes them.
          </p>
        </section>
      )}
    </main>
  );
}
