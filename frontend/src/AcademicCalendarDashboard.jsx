import { useMemo, useState } from 'react';

const periods = [
  {
    name: '2026–2027 Academic Year',
    code: 'AY26-27',
    type: 'YEAR',
    status: 'ACTIVE',
    range: 'Sep 1, 2026 – Jun 30, 2027',
  },
  { name: 'Term 1', code: 'T1-26', type: 'TERM', status: 'ACTIVE', range: 'Sep 1 – Dec 18, 2026' },
  {
    name: 'Winter Break',
    code: 'WB-26',
    type: 'BREAK',
    status: 'PLANNED',
    range: 'Dec 19, 2026 – Jan 4, 2027',
  },
  { name: 'Term 2', code: 'T2-27', type: 'TERM', status: 'PLANNED', range: 'Jan 5 – Mar 26, 2027' },
  {
    name: 'Spring Exams',
    code: 'EXAM-27',
    type: 'EXAM',
    status: 'PLANNED',
    range: 'Jun 14 – Jun 25, 2027',
  },
];

const statusStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PLANNED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-200 text-slate-600',
};

export default function AcademicCalendarDashboard() {
  const [filter, setFilter] = useState('ALL');
  const visible = useMemo(
    () => (filter === 'ALL' ? periods : periods.filter((period) => period.type === filter)),
    [filter]
  );
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Module 11
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Academic calendar</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Coordinate years, terms, breaks, exams, and school-wide locks from one authoritative
              timeline.
            </p>
          </div>
          <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Create period
          </button>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-indigo-950 p-5 text-white">
            <p className="text-sm text-indigo-200">Current period</p>
            <p className="mt-2 text-xl font-semibold">Term 1</p>
            <p className="mt-1 text-sm text-indigo-200">Active until Dec 18, 2026</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Next event</p>
            <p className="mt-2 text-xl font-semibold">Winter Break</p>
            <p className="mt-1 text-sm text-slate-500">Starts in 74 days</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Lock state</p>
            <p className="mt-2 text-xl font-semibold">Open for planning</p>
            <p className="mt-1 text-sm text-slate-500">No active period locks</p>
          </div>
        </section>
        <div className="mt-8 flex flex-wrap gap-2">
          {['ALL', 'YEAR', 'TERM', 'BREAK', 'EXAM'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}
            >
              {type === 'ALL' ? 'All periods' : type}
            </button>
          ))}
        </div>
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.5fr_0.6fr_1fr_0.7fr] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Period</span>
            <span>Type</span>
            <span>Dates</span>
            <span>Status</span>
          </div>
          {visible.map((period) => (
            <div
              key={period.code}
              className="grid grid-cols-[1.5fr_0.6fr_1fr_0.7fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0"
            >
              <div>
                <p className="font-semibold">{period.name}</p>
                <p className="mt-1 text-xs text-slate-400">{period.code}</p>
              </div>
              <span className="text-sm text-slate-500">{period.type}</span>
              <span className="text-sm text-slate-500">{period.range}</span>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[period.status]}`}
              >
                {period.status}
              </span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
