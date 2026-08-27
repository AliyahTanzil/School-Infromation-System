import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const requestHeaders = (schoolId, json = false) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'x-school-id': schoolId,
  ...(json ? { 'content-type': 'application/json' } : {}),
});

export default function AttendanceDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    classId: '',
    sessionDate: new Date().toISOString().slice(0, 10),
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/attendance', { headers: requestHeaders(schoolId) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to load attendance');
      setSessions(payload.items ?? []);
      sessionStorage.setItem('schoolId', schoolId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);
  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: requestHeaders(schoolId, true),
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error?.message ?? 'Unable to create attendance session');
      setForm({ ...form, title: '' });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const transition = async (session, status) => {
    setError('');
    try {
      const response = await fetch(`/api/attendance/${session.id}/status`, {
        method: 'PATCH',
        headers: requestHeaders(schoolId, true),
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error?.message ?? 'Unable to change session status');
      await load();
    } catch (requestError) {
      setError(requestError.message);
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
        <label>
          School ID
          <input
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            placeholder="School UUID"
          />
        </label>
        {loading && <p>Loading attendance…</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>Create register</h2>
        <form onSubmit={create} className="space-y-3">
          <input
            required
            value={form.classId}
            onChange={(event) => setForm({ ...form, classId: event.target.value })}
            placeholder="Class UUID"
          />
          <input
            required
            type="date"
            value={form.sessionDate}
            onChange={(event) => setForm({ ...form, sessionDate: event.target.value })}
          />
          <input
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Register title"
          />
          <button className="primary-button" disabled={!schoolId}>
            Create draft register
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Registers</h2>
        {!loading && sessions.length === 0 && schoolId && <p>No attendance sessions found.</p>}
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
