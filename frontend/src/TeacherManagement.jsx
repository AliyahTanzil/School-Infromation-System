import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const emptyForm = { firstName: '', lastName: '', email: '' };
const nameOf = (teacher) =>
  [teacher.profile?.firstName, teacher.profile?.lastName].filter(Boolean).join(' ') ||
  teacher.employeeNumber;

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/teachers', { params: { page, pageSize: 50 } });
      setTeachers(data.data);
    } catch (reason) {
      setTeachers([]);
      setError(getApiErrorMessage(reason, 'Unable to load school teachers.'));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);

  async function create(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/teachers', {
        profile: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
        },
      });
      setForm(emptyForm);
      setMessage(
        `Teacher profile created. Employee number: ${data.data.employeeNumber}. Activate it when ready.`
      );
      if (page === 1) await load();
      else setPage(1);
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to create teacher profile.'));
    } finally {
      setBusy(false);
    }
  }

  async function activate(teacher) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/teachers/${teacher.id}/status`, { status: 'ACTIVE' });
      setMessage(`${nameOf(teacher)} is active.`);
      await load();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to activate teacher.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="teacher-shell space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Teacher management</h1>
        <p className="mt-2 text-slate-400">
          Manage your school’s teacher profiles and activate new teachers.
        </p>
        <Link className="mt-3 inline-block underline" to="/users">
          Manage login accounts
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-rose-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-300">
          {message}
        </p>
      )}
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Create teacher profile</h2>
        <p className="mt-2 text-slate-400">
          This creates a school staff profile. Use account management for teacher sign-in accounts.
        </p>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ['firstName', 'First name', 100],
            ['lastName', 'Last name', 100],
            ['email', 'Email (optional)', 320],
          ].map(([key, label, maxLength]) => (
            <label key={key} className="block">
              {label}
              <input
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3"
                type={key === 'email' ? 'email' : 'text'}
                required={key !== 'email'}
                maxLength={maxLength}
                value={form[key]}
                disabled={busy}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </label>
          ))}
          <label className="block">
            Employee number
            <input
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3"
              readOnly
              value=""
              placeholder="Auto-generated from teacher initials when saved"
            />
          </label>
          <button
            className="rounded-lg bg-indigo-600 p-3 font-semibold disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            Create teacher profile
          </button>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">School teachers</h2>
          <button type="button" disabled={loading || busy} onClick={load}>
            Refresh teachers
          </button>
        </div>
        {loading ? (
          <p role="status">Loading school teachers...</p>
        ) : teachers.length ? (
          <ul className="mt-4 data-record-grid">
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <h3 className="font-semibold">{nameOf(teacher)}</h3>
                  <p className="text-slate-400">
                    {teacher.employeeNumber} · {teacher.status}
                  </p>
                </div>
                {teacher.status === 'APPLICANT' && (
                  <button type="button" disabled={busy} onClick={() => activate(teacher)}>
                    Activate {nameOf(teacher)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <p className="mt-4">
              No teacher profiles on this page. Existing teacher login accounts may still need to be
              linked.
            </p>
          )
        )}
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            disabled={loading || busy || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            type="button"
            disabled={loading || busy || teachers.length < 50}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
