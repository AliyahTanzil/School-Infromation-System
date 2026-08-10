import { useMemo, useState } from 'react';
import { BusFront, CircleGauge, Fuel, MapPinned, ShieldCheck, Wrench } from 'lucide-react';

const vehicles = [
  {
    number: 'BUS-001',
    plate: 'SAIS-24-01',
    type: 'School bus',
    status: 'Active',
    route: 'North Loop',
  },
  {
    number: 'BUS-002',
    plate: 'SAIS-24-02',
    type: 'Minibus',
    status: 'Maintenance',
    route: 'East Loop',
  },
  { number: 'VAN-004', plate: 'SAIS-24-04', type: 'Van', status: 'Active', route: 'Staff shuttle' },
];
const routes = [
  { code: 'RT-NORTH', name: 'North Loop', stops: 8, students: 42, next: '06:45' },
  { code: 'RT-EAST', name: 'East Loop', stops: 6, students: 31, next: '07:00' },
  { code: 'RT-WEST', name: 'West Loop', stops: 9, students: 48, next: '07:10' },
];

export default function TransportDashboard() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      vehicles.filter((v) =>
        `${v.number} ${v.plate} ${v.route}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              SAIS / Module 23
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Transport operations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Coordinate vehicles, drivers, routes, trips, safety checks, fuel, and parent-ready
              tracking without making GPS a core dependency.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <CircleGauge className="size-4" /> GPS adapter ready
          </div>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['12', 'Vehicles in fleet', BusFront],
            ['7', 'Active routes', MapPinned],
            ['4', 'Safety checks due', ShieldCheck],
            ['86%', 'Fuel efficiency', Fuel],
          ].map(([value, label, Icon]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <Icon className="size-5 text-cyan-300" />
              <p className="mt-5 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </article>
          ))}
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold">Fleet readiness</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Live operational register with safe fallback data.
                </p>
              </div>
              <input
                aria-label="Search vehicles"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fleet"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300"
              />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.number} className="border-t border-slate-800">
                      <td className="py-4">
                        <p className="font-medium">{v.number}</p>
                        <p className="text-xs text-slate-500">
                          {v.type} · {v.plate}
                        </p>
                      </td>
                      <td className="py-4 text-slate-300">{v.route}</td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${v.status === 'Active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3">
              <MapPinned className="size-5 text-cyan-300" />
              <div>
                <h2 className="text-lg font-semibold">Route board</h2>
                <p className="text-sm text-slate-400">Today&apos;s scheduled journeys</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {routes.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between rounded-xl bg-slate-950/70 p-4"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.stops} stops · {r.students} students
                    </p>
                  </div>
                  <span className="font-mono text-sm text-cyan-200">{r.next}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <Wrench className="size-5 text-amber-300" />
            <h3 className="mt-4 font-semibold">Maintenance queue</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              2 vehicles have scheduled work and one inspection expires this week.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <Fuel className="size-5 text-emerald-300" />
            <h3 className="mt-4 font-semibold">Fuel control</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Fuel records, odometer readings, and cost-per-route are ready for review.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <CircleGauge className="size-5 text-cyan-300" />
            <h3 className="mt-4 font-semibold">Tracking abstraction</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Connect GPS, mobile, or IoT providers later without changing core trip operations.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
