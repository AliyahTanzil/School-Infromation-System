import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PaymentGatewayDashboard() {
  const [intents, setIntents] = useState([]);
  const [health, setHealth] = useState(null);
  useEffect(() => {
    Promise.all([
      fetch('/api/payment-gateway/intents', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/payment-gateway/health', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([i, h]) => {
        setIntents(i.data || []);
        setHealth(h.data || h);
      })
      .catch(() => {});
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Module 18
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Payment Gateway</h1>
            <p className="mt-2 text-slate-400">
              Provider-independent payment intents, webhooks, verification, and health.
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">
            Back to demo admin
          </Link>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Provider</p>
            <p className="mt-2 text-xl font-semibold">Mock adapter</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Health</p>
            <p className="mt-2 text-xl font-semibold">
              {health?.healthy ? 'Operational' : 'Unavailable'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Payment intents</p>
            <p className="mt-2 text-xl font-semibold">{intents.length}</p>
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Recent intents</h2>
          <div className="mt-4 flex flex-col gap-3">
            {intents.length ? (
              intents.map((intent) => (
                <div
                  key={intent.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-3"
                >
                  <span className="font-mono text-sm">{intent.internalReference}</span>
                  <span className="text-sm text-slate-400">{intent.channel}</span>
                  <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">
                    {intent.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No payment intents found. Create one through the gateway API or seed fixture.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
