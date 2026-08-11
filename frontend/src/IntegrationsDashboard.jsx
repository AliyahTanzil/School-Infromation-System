import { useMemo, useState } from 'react';
import { Activity, CheckCircle2, KeyRound, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';

const providers = [
  ['Stripe', 'Payments', 'HEALTHY', 'Payment reconciliation and invoice webhooks'],
  ['Twilio', 'SMS', 'CONFIGURED', 'Attendance and emergency notifications'],
  ['SendGrid', 'Email', 'DISCONNECTED', 'Transactional school communications'],
  ['Accounting export', 'Finance', 'CONFIGURED', 'Scheduled ledger exports'],
  ['Analytics warehouse', 'Analytics', 'HEALTHY', 'Governed reporting datasets'],
  ['Government reporting', 'Compliance', 'DISCONNECTED', 'Submission-ready compliance packages'],
];
const tones = {
  HEALTHY: 'text-emerald-300 bg-emerald-400/10',
  CONFIGURED: 'text-amber-300 bg-amber-400/10',
  DISCONNECTED: 'text-slate-400 bg-slate-400/10',
};
export default function IntegrationsDashboard() {
  const [selected, setSelected] = useState(null);
  const [enabled, setEnabled] = useState({
    Stripe: true,
    Twilio: true,
    'Analytics warehouse': true,
  });
  const active = useMemo(() => Object.values(enabled).filter(Boolean).length, [enabled]);
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Module 40 · Control plane
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">External integrations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Connect the systems your school already uses without exposing credentials or losing
              auditability.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
            <span className="text-slate-400">Active connections</span>
            <strong className="ml-2 text-cyan-300">{active}/6</strong>
          </div>
        </header>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {providers.map(([name, category, status, description]) => (
            <article key={name} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                  <KeyRound size={20} />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}>
                  {status.toLowerCase()}
                </span>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {category}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {status === 'HEALTHY' ? (
                    <CheckCircle2 size={14} className="text-emerald-300" />
                  ) : (
                    <WifiOff size={14} />
                  )}{' '}
                  {status === 'HEALTHY' ? 'Last checked 2m ago' : 'Needs setup'}
                </span>
                <button
                  onClick={() => setSelected(name)}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Manage
                </button>
              </div>
            </article>
          ))}
        </section>
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-cyan-300" size={20} />
              <h2 className="font-semibold">Connection safeguards</h2>
            </div>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400 sm:grid-cols-2">
              <li>Secrets are stored as references; the UI never renders tokens.</li>
              <li>Every sync has an idempotency key and retry state.</li>
              <li>Provider health checks are tenant-scoped and auditable.</li>
              <li>Disabled connections stop outbound jobs immediately.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-cyan-300" size={20} />
              <h2 className="font-semibold">Recent activity</h2>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              No failed sync jobs in the current workspace.
            </p>
            <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <RefreshCw size={15} /> Run health checks
            </button>
          </article>
        </section>
        {selected && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 grid place-items-center bg-slate-950/80 p-4"
          >
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold">Manage {selected}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Credentials stay outside this workspace. Configure the connection through the secure
                provider setup flow.
              </p>
              <label className="mt-5 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm">
                <span>Connection enabled</span>
                <input
                  type="checkbox"
                  checked={Boolean(enabled[selected])}
                  onChange={(e) =>
                    setEnabled((current) => ({ ...current, [selected]: e.target.checked }))
                  }
                />
              </label>
              <button
                onClick={() => setSelected(null)}
                className="mt-5 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
