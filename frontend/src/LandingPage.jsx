import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const capabilities = [
  ['Students', Users],
  ['Academics', BookOpen],
  ['Finance', CircleDollarSign],
  ['Analytics', BarChart3],
  ['AI insights', Sparkles],
];

const navItems = ['Platform', 'Features', 'Solutions', 'AI', 'Mobile', 'Security', 'Pricing'];

function DashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-900 p-3 shadow-2xl shadow-indigo-950/40">
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-xs">
              S
            </span>{' '}
            School overview
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            DEMO DATA
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
          {[
            ['Students', '1,248'],
            ['Attendance', '94.8%'],
            ['Revenue', '$84.2k'],
            ['Open tasks', '24'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Attendance trend</p>
              <span className="text-[10px] text-emerald-300">+2.4%</span>
            </div>
            <div className="mt-5 flex h-24 items-end gap-2">
              {[35, 46, 42, 62, 55, 75, 68, 86, 78, 92].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-indigo-500/80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-semibold">AI briefing</p>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              “Three attendance patterns need a follow-up this week.”
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-300">
              <Sparkles size={13} /> Generated insight
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="h-8 w-8 rounded-lg bg-amber-400/10 text-center text-lg leading-8">!</div>
          <div>
            <p className="text-xs font-semibold">Fee collection needs attention</p>
            <p className="text-[10px] text-slate-500">12 accounts are approaching their due date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"
          aria-label="Main navigation"
        >
          <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold shadow-lg shadow-indigo-500/20">
              S
            </span>
            <span>SAIS</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-slate-400 lg:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-white">
                {item}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Sign in
            </Link>
            <div className="flex flex-col items-stretch gap-2">
              <Link
                to="/admin-demo"
                className="rounded-xl bg-indigo-500 px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-indigo-400"
              >
                Get started
              </Link>
              {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_DEMO === 'true') && (
                <Link
                  to="/admin-demo"
                  className="rounded-xl border border-amber-400/40 px-4 py-2.5 text-center text-sm font-semibold text-amber-200"
                >
                  Demo
                </Link>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="border-t border-white/5 px-5 py-4 lg:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  {item}
                </a>
              ))}
              <Link to="/login" className="mt-2 rounded-lg px-3 py-2 text-sm text-slate-300">
                Sign in
              </Link>
              <Link
                to="/admin-demo"
                className="rounded-lg bg-indigo-500 px-3 py-2 text-center text-sm font-semibold"
              >
                Get started
              </Link>
              {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_DEMO === 'true') && (
                <Link
                  to="/admin-demo"
                  className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-amber-200"
                >
                  Demo
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
              <ShieldCheck size={14} /> Secure school operations
            </div>
            <h1 className="max-w-2xl text-balance text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Run your entire school from{' '}
              <span className="text-indigo-400">one intelligent platform.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-slate-400">
              SAIS connects school operations, academics, finance, communication, analytics, and AI
              in one secure system your team can trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admin-demo"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Get started <ArrowRight size={17} />
              </Link>
              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              >
                Explore SAIS <ChevronDown size={16} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" /> Built for school teams
              </span>
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" /> Secure by design
              </span>
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section id="features" className="border-y border-slate-800/80 bg-slate-900/50">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 py-5 lg:px-8">
            {capabilities.map(([label, Icon]) => (
              <div
                key={label}
                className="flex min-w-[145px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-xs font-semibold text-slate-300"
              >
                <Icon size={16} className="text-indigo-400" /> {label}
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-indigo-400">
                One connected ecosystem
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Replace scattered systems with a clearer way to work.
              </h2>
              <p className="mt-5 leading-7 text-slate-400">
                From first enrollment to final report, SAIS gives every role the context they need
                without adding another disconnected tool.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  'Student management',
                  'Keep profiles, admissions, guardians, and history together.',
                ],
                ['Academic operations', 'Give teachers and leaders a shared view of progress.'],
                ['Finance control', 'Track fees, revenue, and follow-up without spreadsheets.'],
                [
                  'Actionable intelligence',
                  'Turn daily activity into decisions your team can act on.',
                ],
              ].map(([title, text], index) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
                >
                  <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-300">
                    0{index + 1}
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="border-y border-slate-800/80 bg-slate-900/50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-3 lg:px-8">
            <div>
              <ShieldCheck className="text-indigo-400" size={26} />
              <h2 className="mt-5 text-3xl font-bold">Trust is part of the product.</h2>
            </div>
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
              {['Role-based access', 'Auditable activity', 'Multi-school ready'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <Check className="text-emerald-400" size={18} />
                  <p className="mt-4 text-sm font-semibold">{item}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Designed to keep the right information with the right people.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-indigo-400">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Make school administration feel simpler.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
            Start with a secure foundation and grow into the connected platform your school needs.
          </p>
          <Link
            to="/admin-demo"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-indigo-400"
          >
            Get started with SAIS <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="border-t border-slate-800 px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-300">SAIS</span>
          <span>School administration, connected.</span>
          <Link to="/login" className="hover:text-white">
            Sign in to workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
