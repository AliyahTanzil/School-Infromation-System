import axios from 'axios';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, Users } from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

const cards = [
  ['Employees', 'employees', Users, 'text-indigo-600 bg-indigo-50'],
  ['Pending leave', 'pendingLeave', CalendarDays, 'text-amber-600 bg-amber-50'],
];
export default function HRDashboard() {
  const [data, setData] = useState({
    employees: 0,
    pendingLeave: 0,
    payrollRuns: [],
    departments: [],
  });
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/hr/dashboard')
      .then((response) => setData(response.data))
      .catch(() => setError('Sign in as a school administrator to load HR data.'));
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">
              Module 20
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">People & payroll</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              A controlled workspace for employee records, leave, attendance, and payroll readiness.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-600">
            <BriefcaseBusiness className="mr-2 inline text-indigo-600" size={18} />
            HR foundation
          </div>
        </div>
        {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, key, Icon, style]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex size-10 items-center justify-center rounded-xl ${style}`}>
                <Icon size={20} />
              </div>
              <p className="mt-5 text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold">{data[key]}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleDollarSign size={20} />
            </div>
            <p className="mt-5 text-sm text-slate-500">Recent payroll runs</p>
            <p className="mt-1 text-3xl font-bold">{data.payrollRuns.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BriefcaseBusiness size={20} />
            </div>
            <p className="mt-5 text-sm text-slate-500">Departments</p>
            <p className="mt-1 text-3xl font-bold">{data.departments.length}</p>
          </div>
        </div>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Payroll control</h2>
            <p className="mt-1 text-sm text-slate-500">
              Finalized payroll remains a historical snapshot and flows into finance through
              controlled integration.
            </p>
            <div className="mt-6 grid gap-3">
              {data.payrollRuns.length ? (
                data.payrollRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                  >
                    <span className="font-medium">{run.status}</span>
                    <span className="text-sm text-slate-500">Net {run.netTotal}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No payroll runs created yet.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-lg font-semibold">Architecture guardrails</h2>
            <ul className="mt-5 grid gap-4 text-sm leading-6 text-slate-300">
              <li>Employees are separate from authentication accounts.</li>
              <li>Contracts and salary changes preserve effective dates.</li>
              <li>Leave approvals and payroll actions are auditable.</li>
              <li>Tenant and school scope applies to every HR query.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
