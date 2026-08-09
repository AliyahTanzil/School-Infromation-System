import { Link } from 'react-router-dom';

const modules = [
  ['/dashboard', 'Dashboard'],
  ['/users', 'Users'],
  ['/students', 'Students'],
  ['/finance', 'Finance'],
  ['/timetables', 'Timetables'],
  ['/payment-gateway', 'Payment Gateway'],
];

export default function AdminWorkspace() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Development admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold">School administration workspace</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Use the module directory while database configuration is being stabilized.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-400"
            >
              <span className="font-semibold">{label}</span>
              <span className="mt-2 block text-sm text-slate-400">Open module</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
