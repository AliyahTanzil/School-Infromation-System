import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function AttendanceDashboard() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    classId: '',
    sessionDate: new Date().toISOString().slice(0, 10),
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [response, options] = await Promise.all([
        api.get('/attendance'),
        api.get('/attendance/options'),
      ]);
      setSessions(response.data.items ?? []);
      setClasses(options.data.classes ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/attendance', form);
      setForm({ ...form, title: '' });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const transition = async (session, status) => {
    setError('');
    try {
      await api.patch(`/attendance/${session.id}/status`, { status });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Daily operations</span>
          <h1>Attendance</h1>
          <p>Create a class register, mark its seeded roster, then lock the audited record.</p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </section>
      <section className="panel">
        <h2>School context</h2>
        <p>Attendance is limited to the signed-in school and your assigned classes.</p>
        {loading && <p>Loading attendance…</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>Create register</h2>
        <form onSubmit={create} className="space-y-3">
          <label className="form-field">
            <span className="form-field__label">Class</span>
            <select
              required
              value={form.classId}
              onChange={(event) => setForm({ ...form, classId: event.target.value })}
            >
              <option value="">Select an assigned class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.section ? ` · ${item.section}` : ''}
                  {item.academicYear?.name ? ` · ${item.academicYear.name}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-field__label">Register date</span>
            <input
              required
              type="date"
              value={form.sessionDate}
              onChange={(event) => setForm({ ...form, sessionDate: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Register title</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="For example, Morning register"
            />
          </label>
          <button className="primary-button" disabled={loading || !form.classId}>
            Create draft register
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Registers</h2>
        {!loading && sessions.length === 0 && <p>No attendance sessions found.</p>}
        {sessions.map((session) => (
          <article className="student-row" key={session.id}>
            <span>
              <strong>{session.title}</strong>
              <small>
                {new Date(session.sessionDate).toLocaleDateString()} · {session.class?.name} ·{' '}
                {session._count?.records ?? 0} learners
              </small>
            </span>
            <span className="space-x-2">
              <b>{session.status}</b>
              {session.status === 'DRAFT' && (
                <button onClick={() => transition(session, 'OPEN')}>Open</button>
              )}
              {session.status === 'OPEN' && (
                <button onClick={() => transition(session, 'LOCKED')}>Lock</button>
              )}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}
