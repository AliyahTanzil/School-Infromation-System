/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { CalendarCheck, Check, LockKeyhole, Search, Users } from 'lucide-react';

const sessions = [
  {
    id: 'morning-8-cedar',
    title: 'Morning register · Grade 8 Cedar',
    date: 'Today · 08:00',
    status: 'Open',
    present: 26,
    total: 28,
    teacher: 'Amara Cole',
  },
  {
    id: 'morning-7-atlas',
    title: 'Morning register · Grade 7 Atlas',
    date: 'Today · 08:05',
    status: 'Open',
    present: 22,
    total: 24,
    teacher: 'Joseph Mensah',
  },
  {
    id: 'yesterday-9-horizon',
    title: 'Morning register · Grade 9 Horizon',
    date: 'Yesterday · 08:00',
    status: 'Locked',
    present: 27,
    total: 28,
    teacher: 'Nadia Okafor',
  },
];

export default function AttendanceDashboard() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        `${session.title} ${session.teacher}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  return (
    <main className="min-h-screen bg-[#08121f] px-5 py-8 text-slate-100 md:px-10">
      <header className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Daily operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Attendance control room</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Open a register, mark every learner once, and lock the record when the day is reconciled.
        </p>
      </header>
      <section className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
        <Stat
          icon={<CalendarCheck />}
          label="Sessions today"
          value="12"
          note="3 still need review"
        />
        <Stat icon={<Users />} label="Present today" value="94.2%" note="Up 1.8% from yesterday" />
        <Stat
          icon={<LockKeyhole />}
          label="Locked registers"
          value="9"
          note="Audit trail complete"
        />
      </section>
      <section className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Today&apos;s registers</h2>
            <p className="mt-1 text-sm text-slate-500">Live sessions across the school</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
            <Search size={16} />
            <span className="sr-only">Search attendance</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search registers"
              className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
            />
          </label>
        </div>
        <div className="mt-2 divide-y divide-slate-800">
          {filtered.map((session) => (
            <article
              key={session.id}
              className="grid gap-4 py-5 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{session.title}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${session.status === 'Open' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {session.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {session.date} · {session.teacher}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">Present</p>
                <p className="mt-1 text-sm text-slate-300">
                  {session.present} / {session.total} learners
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">Rate</p>
                <p className="mt-1 text-sm text-slate-300">
                  {Math.round((session.present / session.total) * 100)}%
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300">
                {session.status === 'Open' ? <Check size={15} /> : <LockKeyhole size={15} />}{' '}
                {session.status === 'Open' ? 'Open register' : 'View audit'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function Stat({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <span className="inline-flex rounded-lg bg-cyan-400/10 p-2 text-cyan-300">{icon}</span>
      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
