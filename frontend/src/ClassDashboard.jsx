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

  const summary = [
    { label: 'Total classes', value: classes.length },
    {
      label: 'Capacity',
      value: classes.reduce((sum, item) => sum + Number(item.capacity || 0), 0),
    },
    { label: 'Search results', value: classes.length },
  ];

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Academic operations</span>
          <h1 className="page-header__title">Classes & sections</h1>
          <p className="page-header__subtitle">
            Manage persisted cohorts, rooms, lifecycle, and enrollment capacity.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </section>

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {summary.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>School context</h2>
            <p>Review cohort data for the currently selected school and search by name or code.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span className="form-field__label">School ID</span>
            <input
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value)}
              placeholder="School UUID"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or code"
            />
          </label>
        </div>

        {loading && <p className="loading-state">Loading classes…</p>}
        {error && (
          <p className="inline-alert" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>Create class section</h2>
            <p>Set up a planned class with academic year, grade, and enrollment capacity.</p>
          </div>
        </div>

        <form onSubmit={create} className="form-grid">
          {['name', 'code', 'academicYearId', 'gradeLevelId', 'section'].map((field) => (
            <label key={field} className="form-field">
              <span className="form-field__label">{field}</span>
              <input
                required={field !== 'section'}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                placeholder={field}
              />
            </label>
          ))}

          <label className="form-field">
            <span className="form-field__label">Capacity</span>
            <input
              required
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              aria-label="Capacity"
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="primary-button" disabled={!schoolId} type="submit">
              Create planned class
            </button>
          </div>
        </form>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Current classes</h2>
            <p>Available section structures and current enrollment capacity.</p>
          </div>
          <span className="status-chip">{classes.length} records</span>
        </div>

        {!loading && classes.length === 0 && schoolId && (
          <p className="empty-state">No classes found.</p>
        )}
        {classes.length > 0 && (
          <div className="result-list">
            {classes.map((item) => (
              <article className="result-row" key={item.id}>
                <span className="result-row__meta">
                  <strong>
                    {item.name}
                    {item.section ? ` · ${item.section}` : ''}
                  </strong>
                  <small>
                    {item.code} · {item.academicYear?.name}
                  </small>
                </span>
                <span className="status-pill">
                  {item._count?.enrollments ?? 0} / {item.capacity} · {item.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
