import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, CircleDashed, LockKeyhole, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  [
    'V51.1',
    'Tenant administration',
    'Implemented',
    '/tenant-admin',
    'Manage schools, tenants, and administrators.',
  ],
  [
    'V51.2',
    'Platform administration',
    'Implemented',
    '/platform-admin',
    'Platform-level controls and operational oversight.',
  ],
  [
    'V51.3',
    'Security administration',
    'Implemented',
    '/security-admin',
    'Security events, controls, and audit visibility.',
  ],
  [
    'V51.4',
    'Student management',
    'Implemented',
    '/students',
    'Student records and administration workspace.',
  ],
  [
    'V51.5',
    'Parent portal',
    'Implemented',
    '/parent-portal',
    'Parent-facing student and classroom access.',
  ],
  [
    'V51.6',
    'Teacher and class management',
    'Implemented',
    '/teachers',
    'Teacher and class administration surfaces.',
  ],
  [
    'V51.7',
    'Academic calendar',
    'Implemented',
    '/academic-calendar',
    'Academic scheduling and calendar workspace.',
  ],
  ['V51.8', 'Attendance', 'Implemented', '/attendance', 'Attendance monitoring and review.'],
  [
    'V51.9',
    'Examinations and results',
    'Implemented',
    '/examinations',
    'Assessment and results workflows.',
  ],
  [
    'V51.10',
    'Finance and billing',
    'Partial',
    '/finance',
    'Finance UI is available; payment integration remains environment-dependent.',
  ],
  ['V51.11', 'Timetables', 'Implemented', '/timetables', 'Timetable planning and review.'],
  [
    'V51.12',
    'School setup',
    'Implemented',
    '/school-setup',
    'School profile and setup configuration.',
  ],
  ['V51.13', 'Library', 'Implemented', '/library', 'Library operations workspace.'],
  [
    'V51.14',
    'Assets and inventory',
    'Implemented',
    '/assets-inventory',
    'Asset inventory and tracking surface.',
  ],
  ['V51.15', 'Transport', 'Implemented', '/transport', 'Transport management workspace.'],
  ['V51.16', 'Boarding', 'Implemented', '/boarding', 'Boarding operations workspace.'],
  [
    'V51.17',
    'Communication',
    'Implemented',
    '/communication',
    'Communication and notification management.',
  ],
  ['V51.18', 'HR', 'Implemented', '/hr', 'Human resources administration surface.'],
  ['V51.19', 'Analytics', 'Implemented', '/analytics', 'Operational analytics and reporting.'],
  [
    'V51.20',
    'Learning analytics',
    'Partial',
    '/learning-analytics',
    'Learning intelligence UI exists; data depth depends on backend records.',
  ],
  [
    'V51.21',
    'AI academic intelligence',
    'Partial',
    '/ai-academic',
    'AI academic surface is available; provider configuration is required.',
  ],
  [
    'V51.22',
    'AI learning workspace',
    'Partial',
    '/ai-learning',
    'AI learning workflows are scaffolded for inspection.',
  ],
  [
    'V51.23',
    'Academic integrity',
    'Partial',
    '/academic-integrity',
    'Integrity workspace is available for workflow review.',
  ],
  [
    'V51.24',
    'AI reports and chat',
    'Partial',
    '/ai-reports',
    'AI reporting UI is available; live generation requires AI configuration.',
  ],
  [
    'V51.25',
    'Integrations and biometrics',
    'Partial',
    '/integrations',
    'Integration and biometric surfaces are available for configuration review.',
  ],
];

const statusStyles = {
  Implemented: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Partial: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  Planned: 'border-slate-700 bg-slate-800 text-slate-400',
};

export default function RoadmapInspectionHub() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const filtered = useMemo(
    () =>
      modules.filter(([version, name, moduleStatus, route, notes]) => {
        const matchesStatus = status === 'All' || moduleStatus === status;
        const haystack = `${version} ${name} ${route} ${notes}`.toLowerCase();
        return matchesStatus && haystack.includes(query.toLowerCase());
      }),
    [query, status]
  );
  const counts = modules.reduce(
    (acc, [, , moduleStatus]) => ({ ...acc, [moduleStatus]: (acc[moduleStatus] || 0) + 1 }),
    {}
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 px-5 py-5 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/"
              className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-300"
            >
              SAIS inspection mode
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Roadmap V51.1 → V51.25
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A development-only inspection map for the demo account. Open any available workspace,
              review its current state, and separate shipped surfaces from integration-dependent
              work.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400"
          >
            Open admin workspace <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {['Implemented', 'Partial', 'Planned'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatus(status === label ? 'All' : label)}
              className={`rounded-2xl border p-4 text-left transition ${status === label ? 'border-indigo-400 bg-indigo-400/10' : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{label}</span>
                {label === 'Implemented' ? (
                  <CheckCircle2 size={17} className="text-emerald-300" />
                ) : label === 'Partial' ? (
                  <CircleDashed size={17} className="text-amber-300" />
                ) : (
                  <LockKeyhole size={17} className="text-slate-500" />
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{counts[label] || 0}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3 top-3 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search modules, routes, or capabilities"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-10 py-3 text-sm text-white outline-none focus:border-indigo-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-slate-500"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </label>
          <div className="flex gap-2">
            {['All', 'Implemented', 'Partial'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setStatus(label)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${status === label ? 'bg-indigo-500 text-white' : 'border border-slate-800 bg-slate-900 text-slate-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(([version, name, moduleStatus, route, notes]) => (
            <article
              key={version}
              className="flex min-h-52 flex-col rounded-2xl border border-slate-800 bg-slate-900/75 p-5 transition hover:border-indigo-400/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-bold text-indigo-300">{version}</span>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[moduleStatus]}`}
                >
                  {moduleStatus}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{notes}</p>
              <Link
                to={route}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
              >
                Inspect workspace <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center text-sm text-slate-500">
            No roadmap modules match this filter.
          </div>
        )}
      </section>
    </main>
  );
}

export { modules };
