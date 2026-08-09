/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { BookOpen, Search, Users, MapPin, ArrowUpRight } from 'lucide-react';

const demoClasses = [
  {
    name: 'Grade 8 · Cedar',
    code: 'G8-CEDAR',
    year: '2026/27',
    status: 'Active',
    students: 28,
    capacity: 32,
    teacher: 'Amara Cole',
    room: 'Science 2',
  },
  {
    name: 'Grade 7 · Atlas',
    code: 'G7-ATLAS',
    year: '2026/27',
    status: 'Active',
    students: 24,
    capacity: 30,
    teacher: 'Joseph Mensah',
    room: 'Room 14',
  },
  {
    name: 'Grade 9 · Horizon',
    code: 'G9-HOR',
    year: '2026/27',
    status: 'Planned',
    students: 0,
    capacity: 28,
    teacher: 'Unassigned',
    room: 'Not assigned',
  },
];

export default function ClassDashboard() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      demoClasses.filter((item) =>
        `${item.name} ${item.code} ${item.teacher}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  return (
    <main className="min-h-screen bg-[#08121f] px-5 py-8 text-slate-100 md:px-10">
      <header className="mx-auto flex max-w-7xl items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Academic operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Classes & sections</h1>
          <p className="mt-2 text-sm text-slate-400">
            Keep every cohort, room, teacher, and enrollment in sync.
          </p>
        </div>
        <button className="hidden items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 md:flex">
          Create class <ArrowUpRight size={16} />
        </button>
      </header>
      <section className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
        <Stat icon={<BookOpen />} label="Active classes" value="18" note="Across 4 grade levels" />
        <Stat icon={<Users />} label="Enrolled learners" value="482" note="94% of capacity" />
        <Stat icon={<MapPin />} label="Room utilization" value="76%" note="12 rooms assigned" />
      </section>
      <section className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Current cohorts</h2>
            <p className="mt-1 text-sm text-slate-500">2026/27 academic year</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
            <Search size={16} />
            <span className="sr-only">Search classes</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search classes"
              className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
            />
          </label>
        </div>
        <div className="mt-2 divide-y divide-slate-800">
          {filtered.map((item) => (
            <article
              key={item.code}
              className="grid gap-4 py-5 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr] md:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{item.name}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.status === 'Active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {item.code} · {item.year}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">Enrollment</p>
                <p className="mt-1 text-sm text-slate-300">
                  {item.students} / {item.capacity} learners
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">Lead teacher</p>
                <p className="mt-1 text-sm text-slate-300">{item.teacher}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">Classroom</p>
                <p className="mt-1 text-sm text-slate-300">{item.room}</p>
              </div>
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
      <div className="flex items-center justify-between text-cyan-300">
        <span className="rounded-lg bg-cyan-400/10 p-2">{icon}</span>
        <span className="text-xs text-slate-500">This term</span>
      </div>
      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
