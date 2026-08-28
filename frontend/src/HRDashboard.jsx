import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, Users } from 'lucide-react';
import api from './api/auth.js';

const emptyEmployee = { employeeNumber: '', firstName: '', lastName: '', email: '' };
const emptyLeave = { employeeId: '', leaveType: '', startsAt: '', endsAt: '', reason: '' };

export default function HRDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [data, setData] = useState({
    employees: 0,
    pendingLeave: 0,
    payrollRuns: [],
    departments: [],
    positions: [],
  });
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employee, setEmployee] = useState(emptyEmployee);
  const [leave, setLeave] = useState(emptyLeave);
  const [payroll, setPayroll] = useState({ periodStart: '', periodEnd: '' });
  const [message, setMessage] = useState('');
  const headers = { 'x-school-id': schoolId };

  const load = useCallback(async () => {
    if (!schoolId) return;
    setMessage('');
    try {
      const [summary, people, requests] = await Promise.all([
        api.get('/hr/dashboard', { headers: { 'x-school-id': schoolId } }),
        api.get('/hr/employees', { headers: { 'x-school-id': schoolId } }),
        api.get('/hr/leave-requests', { headers: { 'x-school-id': schoolId } }),
      ]);
      setData(summary.data.data);
      setEmployees(people.data.data ?? []);
      setLeaveRequests(requests.data.data ?? []);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load HR data.');
    }
  }, [schoolId]);
  useEffect(() => void load(), [load]);

  const submit = async (event, path, body, reset) => {
    event.preventDefault();
    try {
      await api.post(path, body, { headers });
      reset();
      setMessage('HR record saved.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to save the HR record.');
    }
  };
  const decide = async (id, status) => {
    try {
      await api.patch(`/hr/leave-requests/${id}`, { status }, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to decide this request.');
    }
  };
  const finalize = async (id) => {
    try {
      await api.post(`/hr/payroll-runs/${id}/finalize`, {}, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to finalize payroll.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-indigo-300">
              Module 20
            </p>
            <h1 className="mt-2 text-4xl font-bold">People & payroll</h1>
            <p className="mt-2 text-slate-400">
              Manage employees, leave decisions, and payroll snapshots.
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">
            ← Back to administration
          </Link>
        </header>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <label>
            School context{' '}
            <input
              className="ml-3 rounded-lg bg-slate-800 p-2"
              value={schoolId}
              placeholder="School UUID"
              onChange={(event) => {
                setSchoolId(event.target.value.trim());
                sessionStorage.setItem('schoolId', event.target.value.trim());
              }}
            />
          </label>
        </section>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-indigo-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Users, 'Employees', data.employees],
            [CalendarDays, 'Pending leave', data.pendingLeave],
            [CircleDollarSign, 'Payroll runs', data.payrollRuns.length],
            [BriefcaseBusiness, 'Departments', data.departments.length],
          ].map(([Icon, label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Icon size={20} />
              <p className="mt-4 text-slate-400">{label}</p>
              <strong className="text-3xl">{value}</strong>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              submit(event, '/hr/employees', employee, () => setEmployee(emptyEmployee))
            }
          >
            <h2 className="text-xl font-semibold">Add employee</h2>
            {['employeeNumber', 'firstName', 'lastName', 'email'].map((field) => (
              <input
                key={field}
                required={field !== 'email'}
                className="rounded-xl bg-slate-800 p-3"
                placeholder={field}
                value={employee[field]}
                onChange={(event) => setEmployee({ ...employee, [field]: event.target.value })}
              />
            ))}
            <button disabled={!schoolId} className="rounded-xl bg-indigo-600 p-3 font-semibold">
              Create employee
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              submit(event, '/hr/leave-requests', leave, () => setLeave(emptyLeave))
            }
          >
            <h2 className="text-xl font-semibold">Request leave</h2>
            <select
              required
              className="rounded-xl bg-slate-800 p-3"
              value={leave.employeeId}
              onChange={(event) => setLeave({ ...leave, employeeId: event.target.value })}
            >
              <option value="">Select employee</option>
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </select>
            <input
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Leave type"
              value={leave.leaveType}
              onChange={(event) => setLeave({ ...leave, leaveType: event.target.value })}
            />
            <input
              required
              type="date"
              className="rounded-xl bg-slate-800 p-3"
              value={leave.startsAt}
              onChange={(event) => setLeave({ ...leave, startsAt: event.target.value })}
            />
            <input
              required
              type="date"
              className="rounded-xl bg-slate-800 p-3"
              value={leave.endsAt}
              onChange={(event) => setLeave({ ...leave, endsAt: event.target.value })}
            />
            <button disabled={!schoolId} className="rounded-xl bg-indigo-600 p-3 font-semibold">
              Submit request
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              submit(event, '/hr/payroll-runs', payroll, () =>
                setPayroll({ periodStart: '', periodEnd: '' })
              )
            }
          >
            <h2 className="text-xl font-semibold">Create payroll run</h2>
            <input
              required
              type="date"
              className="rounded-xl bg-slate-800 p-3"
              value={payroll.periodStart}
              onChange={(event) => setPayroll({ ...payroll, periodStart: event.target.value })}
            />
            <input
              required
              type="date"
              className="rounded-xl bg-slate-800 p-3"
              value={payroll.periodEnd}
              onChange={(event) => setPayroll({ ...payroll, periodEnd: event.target.value })}
            />
            <button disabled={!schoolId} className="rounded-xl bg-indigo-600 p-3 font-semibold">
              Create payroll
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Leave decisions</h2>
            {leaveRequests.map((item) => (
              <div key={item.id} className="mt-3 rounded-xl border border-slate-800 p-4">
                <strong>{item.leaveType}</strong>
                <p className="text-sm text-slate-400">
                  {item.status} · {new Date(item.startsAt).toLocaleDateString()}–
                  {new Date(item.endsAt).toLocaleDateString()}
                </p>
                {item.status === 'PENDING' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => decide(item.id, 'APPROVED')}
                      className="rounded bg-emerald-700 px-3 py-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(item.id, 'REJECTED')}
                      className="rounded bg-rose-700 px-3 py-1"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!leaveRequests.length && <p className="mt-3 text-slate-500">No leave requests.</p>}
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Payroll control</h2>
            {data.payrollRuns.map((run) => (
              <div
                key={run.id}
                className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 p-4"
              >
                <span>
                  <strong>{run.status}</strong>
                  <small className="block text-slate-400">
                    Total {(run.totalMinor / 100).toFixed(2)}
                  </small>
                </span>
                {run.status === 'DRAFT' && (
                  <button
                    onClick={() => finalize(run.id)}
                    className="rounded bg-indigo-600 px-3 py-2"
                  >
                    Finalize
                  </button>
                )}
              </div>
            ))}
            {!data.payrollRuns.length && <p className="mt-3 text-slate-500">No payroll runs.</p>}
          </article>
        </section>
      </div>
    </main>
  );
}
