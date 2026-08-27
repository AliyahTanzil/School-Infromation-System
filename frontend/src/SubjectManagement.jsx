import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const authorization = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
});

export default function SubjectManagement() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/subjects', {
        headers: { ...authorization(), 'x-school-id': schoolId },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to load subjects');
      setSubjects(payload.data ?? []);
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
    const response = await fetch('/api/subjects', {
      method: 'POST',
      headers: { ...authorization(), 'content-type': 'application/json', 'x-school-id': schoolId },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload?.error?.message ?? 'Unable to create subject');
    setForm({ code: '', name: '', description: '' });
    await load();
  };

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Academic catalog</span>
          <h1>Subjects</h1>
          <p>Create and maintain the subject catalog for one school.</p>
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
            placeholder="Select or paste the school UUID"
          />
        </label>
        {!schoolId && <p>Enter a school ID to load its subject catalog.</p>}
        {loading && <p>Loading subjects…</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>Add subject</h2>
        <form onSubmit={create} className="space-y-3">
          <input
            required
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            placeholder="Code, e.g. MATH"
          />
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Subject name"
          />
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description (optional)"
          />
          <button className="primary-button" disabled={!schoolId}>
            Create subject
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Subject catalog</h2>
        {!loading && subjects.length === 0 && schoolId && <p>No subjects found.</p>}
        {subjects.map((subject) => (
          <article className="student-row" key={subject.id}>
            <span>
              <strong>{subject.name}</strong>
              <small>{subject.code}</small>
            </span>
            <span className="status-pill">{subject.status}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
