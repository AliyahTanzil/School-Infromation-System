import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const headers = (schoolId) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'x-school-id': schoolId,
});

export default function ClassDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    academicYearId: '',
    gradeLevelId: '',
    section: '',
    capacity: 30,
  });

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/classes?query=${encodeURIComponent(query)}`, {
        headers: headers(schoolId),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to load classes');
      setClasses(payload.data?.items ?? []);
      sessionStorage.setItem('schoolId', schoolId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [query, schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { ...headers(schoolId), 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to create class');
      setForm({
        name: '',
        code: '',
        academicYearId: '',
        gradeLevelId: '',
        section: '',
        capacity: 30,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Academic operations</span>
          <h1>Classes & sections</h1>
          <p>Manage persisted cohorts, rooms, lifecycle, and enrollment capacity.</p>
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
        <label>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or code"
          />
        </label>
        {loading && <p>Loading classes…</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>Create class section</h2>
        <form onSubmit={create} className="space-y-3">
          {['name', 'code', 'academicYearId', 'gradeLevelId', 'section'].map((field) => (
            <input
              key={field}
              required={field !== 'section'}
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              placeholder={field}
            />
          ))}
          <input
            required
            type="number"
            min="1"
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            aria-label="Capacity"
          />
          <button className="primary-button" disabled={!schoolId}>
            Create planned class
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Current classes</h2>
        {!loading && classes.length === 0 && schoolId && <p>No classes found.</p>}
        {classes.map((item) => (
          <article className="student-row" key={item.id}>
            <span>
              <strong>
                {item.name}
                {item.section ? ` · ${item.section}` : ''}
              </strong>
              <small>
                {item.code} · {item.academicYear?.name}
              </small>
            </span>
            <span>
              {item._count?.enrollments ?? 0} / {item.capacity} · {item.status}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}
