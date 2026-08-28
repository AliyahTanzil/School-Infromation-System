import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

export default function CommunicationDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [notifications, setNotifications] = useState([]);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ title: '', body: '', recipients: '', channels: ['IN_APP'] });
  const headers = useCallback(() => ({ 'x-school-id': schoolId }), [schoolId]);
  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [events, delivery] = await Promise.all([
        api.get('/communication/notifications', { headers: headers() }),
        api.get('/communication/notification-delivery-health', { headers: headers() }),
      ]);
      setNotifications(events.data.data ?? []);
      setHealth(delivery.data.data ?? null);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load notifications.');
    }
  }, [headers, schoolId]);
  useEffect(() => {
    load();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const userIds = form.recipients
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      await api.post(
        '/communication/notifications',
        {
          eventType: 'SCHOOL_ANNOUNCEMENT',
          payload: { title: form.title, body: form.body, priority: 'NORMAL' },
          userIds,
          channels: form.channels,
        },
        { headers: headers() }
      );
      setMessage('Notification queued for delivery.');
      setForm({ ...form, title: '', body: '', recipients: '' });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to create notification.');
    }
  };
  const toggleChannel = (channel) =>
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Module 19
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Communication center</h1>
            <p className="mt-3 text-slate-400">
              Create tenant-safe announcements and monitor delivery.
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">
            Back to administration
          </Link>
        </header>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-indigo-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label>
            School ID
            <input
              className="ml-3 rounded-lg bg-slate-800 p-2"
              value={schoolId}
              onChange={(event) => {
                setSchoolId(event.target.value);
                sessionStorage.setItem('schoolId', event.target.value);
              }}
              placeholder="School UUID"
            />
          </label>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Create notification</h2>
          <form className="mt-4 grid gap-3" onSubmit={create}>
            <input
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <textarea
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Message"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
            <input
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Recipient user UUIDs, comma separated"
              value={form.recipients}
              onChange={(event) => setForm({ ...form, recipients: event.target.value })}
            />
            <div className="flex flex-wrap gap-3">
              {['IN_APP', 'EMAIL', 'SMS', 'PUSH'].map((channel) => (
                <label key={channel}>
                  <input
                    type="checkbox"
                    checked={form.channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                  />{' '}
                  {channel}
                </label>
              ))}
            </div>
            <button
              disabled={!schoolId || !form.channels.length}
              className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold"
            >
              Queue notification
            </button>
          </form>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p>Events</p>
            <strong className="text-3xl">{notifications.length}</strong>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p>Delivered/read</p>
            <strong className="text-3xl">{health?.delivered ?? 0}</strong>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p>Delivery rate</p>
            <strong className="text-3xl">{health?.deliveryRate ?? 100}%</strong>
          </article>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Recent notifications</h2>
          {notifications.map((item) => (
            <article key={item.id} className="mt-3 rounded-xl border border-slate-800 p-4">
              <strong>{item.payload?.title || item.eventType}</strong>
              <p className="text-slate-400">{item.payload?.body}</p>
            </article>
          ))}
          {!notifications.length && <p className="mt-4 text-slate-500">No notifications yet.</p>}
        </section>
      </div>
    </main>
  );
}
