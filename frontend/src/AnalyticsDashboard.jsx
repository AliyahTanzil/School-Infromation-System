import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const defaultMetrics = [
  { label: 'Active students', value: 'Not available' },
  { label: 'Attendance rate', value: 'Not available' },
  { label: 'Fee collection', value: 'Not available' },
  { label: 'Student / teacher', value: 'Not available' },
];
const defaultSeries = [];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('This academic year');
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [series, setSeries] = useState(defaultSeries);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get('/analytics/overview')
      .then((res) => {
        if (!mounted || !res.data?.data) return;
        const data = res.data.data;
        if (data.metrics && Array.isArray(data.metrics)) {
          setMetrics(
            data.metrics.map((m) => ({
              label: m.label,
              value: m.value,
              change: m.change,
              positive: m.positive ?? true,
            }))
          );
        }
        if (Array.isArray(data.series)) {
          setSeries(data.series);
        }
      })
      .catch((reason) => {
        if (mounted) setError(getApiErrorMessage(reason, 'Unable to load analytics'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => series.reduce((a, b) => a + b, 0), [series]);
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
        {loading && <p role="status">Loading analytics...</p>}
        {error && <p role="alert">{error}</p>}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <article
              key={m.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <p className="text-sm text-slate-400">{m.label}</p>
              <div className="mt-4 flex items-end justify-between">
                <strong className="text-3xl tracking-tight">{m.value}</strong>
                {m.change != null && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300">
                    {m.positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {m.change}
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Institution health index</p>
                <h2 className="mt-1 text-xl font-semibold">Historical signals</h2>
              </div>
              <BarChart3 className="text-cyan-300" />
            </div>
            <div className="mt-8 flex h-52 items-end gap-3">
              {!series.length && <p>Historical analytics are not available.</p>}
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
                {series.length ? `${Math.round(total / series.length)}/100` : 'Not available'}
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
              <p className="text-sm text-slate-400">Priority signals are not available.</p>
            </div>
          </article>
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Reporting runway</p>
                <h2 className="mt-1 text-xl font-semibold">Scheduled intelligence</h2>
              </div>
              <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-300">
                Tenant scoped
              </span>
            </div>
            <div className="mt-6 divide-y divide-slate-800">
              {[
                ['Executive weekly brief', 'Ready · Today, 06:00'],
                ['Attendance intervention list', 'Scheduled · Tomorrow, 07:00'],
                ['Finance collection rollup', 'Ready · Yesterday, 18:00'],
              ].map(([name, status]) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="mt-1 text-sm text-slate-500">{status}</p>
                  </div>
                  <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-300/60">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm text-slate-400">Data contract</p>
            <h2 className="mt-1 text-xl font-semibold">Evidence stays governed</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Every metric is scoped to the active tenant, evaluated against an approved definition,
              and exported through an auditable queue.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {[
                'No arbitrary SQL queries',
                'Exports are tenant-scoped',
                'KPI targets are versioned',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
