import { ArrowRight, CalendarDays, GraduationCap, LayoutDashboard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

const modules = [
  ['Dashboard', '/dashboard', LayoutDashboard, 'Operations overview and school health.'],
  ['Users', '/users', Users, 'Manage accounts and access.'],
  ['Students', '/students', GraduationCap, 'Student records and enrollment.'],
  ['Timetables', '/timetables', CalendarDays, 'Scheduling, conflicts, and publication.'],
];

export default function AdminWorkspace() {
  const { user, logout } = useAuth();
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">
              Local development workspace
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin command center</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              A safe frontend-only demo session for exploring the existing admin modules while
              database issues are being diagnosed.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-amber-200">
              DEMO ONLY
            </span>
            <span>{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500"
            >
              Exit
            </button>
          </div>
        </header>
        <section
          className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Admin modules"
        >
          {modules.map(([title, href, Icon, description]) => (
            <Link
              key={href}
              to={href}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/60"
            >
              <Icon className="text-indigo-400" size={22} />
              <h2 className="mt-8 font-semibold">{title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-indigo-300">
                Open module <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
