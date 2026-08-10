import { useMemo, useState } from 'react';
import { BarChart3, Download, Filter, TrendingDown, TrendingUp } from 'lucide-react';

const metrics = [
  { label: 'Active students', value: '2,486', change: '+4.8%', positive: true },
  { label: 'Attendance rate', value: '94.2%', change: '+1.6%', positive: true },
  { label: 'Fee collection', value: '82.7%', change: '+6.2%', positive: true },
  { label: 'Student / teacher', value: '18.4', change: '-0.9', positive: true },
];
const series = [72, 76, 74, 81, 84, 88, 91];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('This academic year');
  const total = useMemo(() => series.reduce((a, b) => a + b, 0), []);
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Decision intelligence
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Executive analytics</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              A read-only view of the signals shaping student success, operations, and financial
              health.
            </p>
          </div>
          <div className="flex gap-3">
            <select
              aria-label="Reporting period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200"
            >
              <option>This academic year</option>
              <option>This term</option>
              <option>Last 30 days</option>
            </select>
            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950">
              <Download size={16} /> Export
            </button>
          </div>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <article
              key={m.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <p className="text-sm text-slate-400">{m.label}</p>
              <div className="mt-4 flex items-end justify-between">
                <strong className="text-3xl tracking-tight">{m.value}</strong>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300">
                  {m.positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {m.change}
                </span>
              </div>
            </article>
          ))}
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Institution health index</p>
                <h2 className="mt-1 text-xl font-semibold">Signals are trending upward</h2>
              </div>
              <BarChart3 className="text-cyan-300" />
            </div>
            <div className="mt-8 flex h-52 items-end gap-3">
              {series.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-cyan-300/80"
                    style={{ height: `${v * 1.55}px` }}
                    title={`${v} index`}
                  />
                  <span className="text-xs text-slate-500">
                    {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-400">
              Period: {period}. Aggregate score:{' '}
              <span className="font-medium text-slate-200">
                {Math.round(total / series.length)}/100
              </span>
              .
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Priority signals</p>
                <h2 className="mt-1 text-xl font-semibold">Where to look next</h2>
              </div>
              <Filter size={18} className="text-slate-500" />
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Attendance', 'Grade 8 absence rate is 3.2% above baseline.', 'amber'],
                ['Collections', 'Senior fees are pacing 8% ahead of plan.', 'emerald'],
                ['Transport', 'Route utilization is below 70% on two corridors.', 'cyan'],
              ].map(([title, text, tone]) => (
                <div key={title} className="border-l-2 border-cyan-300/60 pl-4">
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                  <span
                    className={`mt-2 inline-block text-xs uppercase tracking-wider text-${tone}-300`}
                  >
                    Open drill-down
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
