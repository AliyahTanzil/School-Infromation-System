import { AlertTriangle, Archive, LockKeyhole, ShieldCheck, Users, KeyRound } from 'lucide-react';

const stats = [
  ['99.8%', 'Security posture', ShieldCheck, 'Controls operating within policy'],
  ['7', 'Open security events', AlertTriangle, '2 high-priority items need review'],
  ['42', 'Active sessions', Users, 'Across authorized school users'],
  ['3', 'Backups verified', Archive, 'Latest restore point is healthy'],
];
const areas = [
  [
    'Audit trail',
    'Append-only activity history with tenant-scoped access and redacted metadata.',
    LockKeyhole,
  ],
  [
    'Access monitoring',
    'Review login history, active sessions, devices, and suspicious activity.',
    KeyRound,
  ],
  [
    'Recovery & privacy',
    'Track backup verification, retention policies, and data protection controls.',
    Archive,
  ],
];
export default function SecurityDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Security, audit & data protection
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Make trust visible across SAIS.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Monitor privileged actions, access signals, recovery readiness, and privacy controls
            without exposing passwords, tokens, or unnecessary personal data.
          </p>
        </header>
        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Security overview"
        >
          {stats.map(([value, label, Icon, detail]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <Icon className="text-indigo-300" size={20} />
                <span className="text-2xl font-semibold">{value}</span>
              </div>
              <h2 className="mt-5 font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-slate-400">{detail}</p>
            </article>
          ))}
        </section>
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Security operations</p>
            <h2 className="mt-1 text-xl font-semibold">Control readiness</h2>
            <div className="mt-6 space-y-4">
              {[
                ['MFA coverage', 'Required for privileged roles', '92%'],
                ['Audit pipeline', 'Events retained and queryable', '100%'],
                ['Backup verification', 'Latest artifact integrity check', 'Passed'],
              ].map(([name, detail, value]) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="mt-1 text-sm text-slate-500">{detail}</p>
                  </div>
                  <span className="font-mono text-sm text-indigo-300">{value}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6">
            <p className="text-sm font-semibold text-amber-200">Review queue</p>
            <h2 className="mt-2 text-xl font-semibold">2 items need attention</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>1 suspicious login pattern is awaiting acknowledgement.</li>
              <li>1 privileged session exceeded the configured timeout.</li>
              <li>No backup verification failures detected.</li>
            </ul>
          </article>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {areas.map(([title, description, Icon]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <Icon className="text-indigo-300" size={22} />
              <h2 className="mt-5 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
