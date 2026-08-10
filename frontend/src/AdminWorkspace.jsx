import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Network,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
  LibraryBig,
} from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';

const moduleGroups = [
  {
    label: 'Core operations',
    description: 'Daily school administration and academic workflows.',
    modules: [
      ['/dashboard', 'Overview', 'Live school snapshot, tasks, and key activity.', LayoutDashboard],
      [
        '/students',
        'Students',
        'Admissions, profiles, guardians, and student records.',
        GraduationCap,
      ],
      ['/teachers', 'Teachers', 'Teaching staff profiles, assignments, and workload.', Users],
      ['/classes', 'Classes', 'Class groups, sections, and academic organization.', BookOpenCheck],
      ['/users', 'User management', 'Roles, permissions, and platform accounts.', ShieldCheck],
    ],
  },
  {
    label: 'Academic planning',
    description: 'Plan the school year and monitor learning outcomes.',
    modules: [
      ['/timetables', 'Timetables', 'Build and review class schedules.', CalendarDays],
      [
        '/academic-calendar',
        'Academic calendar',
        'Events, terms, holidays, and important dates.',
        CalendarDays,
      ],
      ['/attendance', 'Attendance', 'Track daily attendance and patterns.', ClipboardCheck],
      [
        '/examinations',
        'Examinations',
        'Manage exam sessions and assessment activity.',
        BookOpenCheck,
      ],
      ['/results', 'Results', 'Review academic results and performance.', Network],
    ],
  },
  {
    label: 'Finance and communication',
    description: 'Explore the administrative workflows that connect families and staff.',
    modules: [
      ['/finance', 'Finance', 'Fees, transactions, and financial reporting.', Landmark],
      [
        '/payment-gateway',
        'Payment gateway',
        'Test payment configuration and collection flows.',
        CreditCard,
      ],
      [
        '/communication',
        'Communication',
        'Notifications, announcements, and messaging.',
        MessageSquareText,
      ],
      ['/hr', 'HR and payroll', 'Staff records, leave, attendance, and payroll.', WalletCards],
      [
        '/library',
        'Library management',
        'Catalog, copies, circulation, fines, and digital resources.',
        LibraryBig,
      ],
      ['/parent-portal', 'Parent portal', 'Preview the family-facing school experience.', Users],
      [
        '/school-setup',
        'School setup',
        'School identity, settings, and administration.',
        Settings2,
      ],
    ],
  },
];

export default function AdminWorkspace() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const leaveDemo = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
                SAIS Demo workspace
              </p>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                Test environment
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Explore the complete school administration platform.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Browse every module with a seeded demo administrator account. You can explore
              workflows freely; this environment is isolated from production school data.
            </p>
          </div>
          <button
            type="button"
            onClick={leaveDemo}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            <LogOut size={16} />
            Exit Demo
          </button>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Demo environment details">
          {[
            ['17', 'Modules available'],
            ['Demo Admin', 'Active role'],
            ['Safe to explore', 'Data boundary'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </section>

        <div className="mt-12 space-y-12">
          {moduleGroups.map((group) => (
            <section key={group.label} aria-labelledby={group.label.replaceAll(' ', '-')}>
              <div className="mb-5">
                <h2
                  id={group.label.replaceAll(' ', '-')}
                  className="text-xl font-semibold text-white"
                >
                  {group.label}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{group.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.modules.map(([href, label, description, Icon]) => (
                  <Link
                    key={href}
                    to={href}
                    className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-slate-800/90"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                        <Icon size={19} />
                      </span>
                      <ArrowRight
                        size={18}
                        className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-indigo-300"
                      />
                    </div>
                    <h3 className="mt-5 font-semibold text-white">{label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                    <span className="mt-4 block text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Open module
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
