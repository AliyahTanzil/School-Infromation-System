import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accountType: 'STAFF',
    status: 'ACTIVE',
  };
  const [form, setForm] = useState(emptyForm);
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
      setForm(emptyForm);
      setMessage('User created and saved to the backend.');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create user');
    } finally {
      setSaving(false);
    }
  };

  const metrics = [
    { label: 'Visible users', value: users.length },
    { label: 'Active', value: users.filter((user) => user.status === 'ACTIVE').length },
    {
      label: 'Pending',
      value: users.filter((user) => user.status === 'PENDING_VERIFICATION').length,
    },
  ];

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">SAIS / Administration</p>
          <h1 className="page-header__title">User management</h1>
          <p className="page-header__subtitle">
            Create accounts through the frontend and verify they persist in the backend.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </header>

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {metrics.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>Create user</h2>
            <p>Provision staff or stakeholder accounts with the correct role and status.</p>
          </div>
        </div>

        <form onSubmit={createUser} className="form-grid">
          <label className="form-field">
            <span className="form-field__label">First name</span>
            <input
              required
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Last name</span>
            <input
              required
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </label>

          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            <span className="form-field__label">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            <span className="form-field__label">Temporary password</span>
            <input
              required
              minLength={12}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Account type</span>
            <select
              value={form.accountType}
              onChange={(event) => setForm({ ...form, accountType: event.target.value })}
            >
              <option value="STAFF">Staff</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>

          <label className="form-field">
            <span className="form-field__label">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING_VERIFICATION">Pending verification</option>
            </select>
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Create user'}
            </button>
          </div>

          {message && (
            <p className="inline-alert" role="status" style={{ gridColumn: '1 / -1' }}>
              {message}
            </p>
          )}
          {error && (
            <p className="inline-alert" role="alert" style={{ gridColumn: '1 / -1' }}>
              {error}
            </p>
          )}
        </form>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Backend users</h2>
            <p>Review recently created identities and their current account state.</p>
          </div>
          <span className="status-chip">{users.length} visible</span>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.accountType ?? '—'}</td>
                  <td>
                    <span className="status-chip">{user.status}</span>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
