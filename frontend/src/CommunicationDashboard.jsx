import { useEffect, useState } from 'react';

export default function CommunicationDashboard() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    fetch('/api/communication/notifications')
      .then((response) => response.json())
      .then((payload) => setNotifications(payload.data || []))
      .catch(() => setNotifications([]));
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Module 19
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Communication center</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Centralize in-app notifications, announcements, and future email, SMS, push, and WhatsApp
          delivery.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Notifications</p>
            <p className="mt-2 text-3xl font-semibold">{notifications.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Channels</p>
            <p className="mt-2 text-3xl font-semibold">5</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Provider status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">Ready for adapters</p>
          </div>
        </div>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Recent notifications</h2>
          <div className="mt-5 flex flex-col gap-3">
            {notifications.length ? (
              notifications.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.body}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No notifications have been created yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
