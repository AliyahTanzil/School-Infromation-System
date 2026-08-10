import { BedDouble, Building2, ClipboardCheck, Home, Users, Utensils } from 'lucide-react';

const stats = [
  ['12', 'Dormitories', Building2, 'Across active boarding facilities'],
  ['148', 'Beds occupied', BedDouble, '84% of available capacity'],
  ['28', 'Available beds', Home, 'Ready for approved applicants'],
  ['9', 'Pending applications', Users, 'Awaiting boarding review'],
];
const areas = [
  [
    'Allocation & check-in',
    'Manage historical bed allocations, arrivals, transfers, and check-out.',
    ClipboardCheck,
  ],
  ['Attendance & welfare', 'Review daily boarding attendance and student welfare signals.', Users],
  [
    'Meals & services',
    'Coordinate meal schedules, service attendance, and hostel operations.',
    Utensils,
  ],
];
export default function BoardingDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Boarding / hostel management
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            A safer, clearer view of residential life.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Manage facilities, bed-level allocations, attendance, meals, inspections, and student
            welfare from one operational workspace.
          </p>
        </header>
        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Boarding overview"
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today&apos;s operations</p>
                <h2 className="mt-1 text-xl font-semibold">Boarding readiness</h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Stable
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Room inspections', '18 of 20 completed', '90%'],
                ['Attendance capture', 'Morning round complete', '100%'],
                ['Meal service', 'Lunch service scheduled', '12:30'],
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
            <p className="text-sm font-semibold text-amber-200">Safety signals</p>
            <h2 className="mt-2 text-xl font-semibold">3 items need review</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>2 maintenance requests are open.</li>
              <li>1 visitor pass is awaiting checkout.</li>
              <li>All active beds have valid allocations.</li>
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
