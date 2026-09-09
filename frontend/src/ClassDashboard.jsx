import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const currentYear = new Date().getFullYear();
const academicYears = Array.from({ length: 16 }, (_, index) => currentYear - 5 + index);
const gradeLevels = [
  { code: 'PRE_SCHOOL_NURSERY', name: 'Pre-School Nursery' },
  { code: 'PRIMARY_SCHOOL', name: 'Primary School' },
  { code: 'JUNIOR_SECONDARY', name: 'Junior Secondary' },
  { code: 'SENIOR_SECONDARY', name: 'Senior Secondary' },
];

export default function ClassDashboard() {
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    academicYear: currentYear,
    gradeLevelCode: '',
    section: '',
    capacity: 30,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/classes', { params: { query } });
      setClasses(response.data.data?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/classes', {
        ...form,
        code: form.code || undefined,
        capacity: Number(form.capacity),
      });
      setForm({
        name: '',
        code: '',
        academicYear: currentYear,
        gradeLevelCode: '',
        section: '',
        capacity: 30,
      });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
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
          {['name', 'code', 'section'].map((field) => (
            <label key={field} className="form-field">
              <span className="form-field__label">{field}</span>
              <input
                required={field === 'name'}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                placeholder={field === 'code' ? 'Auto-generated if left blank' : field}
              />
            </label>
          ))}

          <label className="form-field">
            <span className="form-field__label">Academic year</span>
            <select
              required
              value={form.academicYear}
              onChange={(event) => setForm({ ...form, academicYear: Number(event.target.value) })}
              aria-label="Academic year"
              aria-describedby="academic-year-help"
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <small id="academic-year-help">Choose the starting year for this class.</small>
          </label>

          <label className="form-field">
            <span className="form-field__label">Grade level</span>
            <select
              required
              value={form.gradeLevelCode}
              onChange={(event) => setForm({ ...form, gradeLevelCode: event.target.value })}
            >
              <option value="">Select grade level</option>
              {gradeLevels.map((gradeLevel) => (
                <option key={gradeLevel.code} value={gradeLevel.code}>
                  {gradeLevel.name}
                </option>
              ))}
            </select>
          </label>
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
            <button className="primary-button" disabled={loading} type="submit">
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

        {!loading && classes.length === 0 && !error && (
          <p className="empty-state">No classes found.</p>
        )}
        {classes.length > 0 && (
          <div className="result-list">
            {classes.map((item) => (
              <Link className="result-row" key={item.id} to={`/classes/${item.id}`}>
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
