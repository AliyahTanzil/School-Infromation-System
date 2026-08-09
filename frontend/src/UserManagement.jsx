import { useCallback, useEffect, useState } from 'react';
import api from './api/auth.js';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', status: 'ACTIVE' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data } = await api.get('/users', { params: { pageSize: 25 } });
    setUsers(data.data.items);
  }, []);

  useEffect(() => {
    loadUsers().catch((err) => setError(err.response?.data?.message || 'Unable to load users'));
  }, [loadUsers]);

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.post('/users', form);
      setForm({ email: '', password: '', status: 'ACTIVE' });
      setMessage('User created and saved to the backend.');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
            SAIS / Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">User management</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create accounts through the frontend and verify they persist in the backend.
          </p>
        </header>
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={createUser}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold">Create user</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm text-slate-400">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                />
              </label>
              <label className="text-sm text-slate-400">
                Temporary password
                <input
                  required
                  minLength={12}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                />
              </label>
              <label className="text-sm text-slate-400">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_VERIFICATION">Pending verification</option>
                </select>
              </label>
              <button
                disabled={saving}
                className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Create user'}
              </button>
              {message && (
                <p className="text-sm text-emerald-300" role="status">
                  {message}
                </p>
              )}
              {error && (
                <p className="text-sm text-rose-300" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Backend users</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-800">
                      <td className="py-3">{user.email}</td>
                      <td className="py-3 text-emerald-300">{user.status}</td>
                      <td className="py-3 text-slate-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
