import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function SubjectManagement() {
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    classAssignments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectResponse, classResponse] = await Promise.all([
        api.get('/subjects'),
        api.get('/classes', { params: { pageSize: 100 } }),
      ]);
      setSubjects(subjectResponse.data.data ?? []);
      setClasses(classResponse.data.data?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load subjects'));
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
    setSaving(true);
    try {
      await api.post('/subjects', { ...form, code: form.code || undefined });
      setForm({ code: '', name: '', description: '', classAssignments: [] });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create subject'));
    } finally {
      setSaving(false);
    }
  };

  const toggleClass = (classId) => {
    const selected = form.classAssignments.some((item) => item.classId === classId);
    setForm({
      ...form,
      classAssignments: selected
        ? form.classAssignments.filter((item) => item.classId !== classId)
        : [...form.classAssignments, { classId, teachingFocus: '' }],
    });
  };

  const setTeachingFocus = (classId, teachingFocus) =>
    setForm({
      ...form,
      classAssignments: form.classAssignments.map((item) =>
        item.classId === classId ? { ...item, teachingFocus } : item
      ),
    });

  const summary = [
    { label: 'Total subjects', value: subjects.length },
    { label: 'Active', value: subjects.filter((subject) => subject.status === 'ACTIVE').length },
    { label: 'Draft', value: subjects.filter((subject) => subject.status === 'DRAFT').length },
  ];

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Academic catalog</span>
          <h1 className="page-header__title">Subjects</h1>
          <p className="page-header__subtitle">
            Create and maintain the subject catalog for one school.
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
        {loading && <p className="loading-state">Loading subjects…</p>}
        {error && (
          <p className="inline-alert" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>Add subject</h2>
            <p>Capture the subject code, title, and teaching focus for the school catalog.</p>
          </div>
        </div>

        <form onSubmit={create} className="form-grid">
          <label className="form-field">
            <span className="form-field__label">Code</span>
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="Auto-generated if left blank"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Subject name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Subject name"
            />
          </label>

          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            <span className="form-field__label">Description</span>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Description (optional)"
            />
          </label>

          <fieldset className="form-field" style={{ gridColumn: '1 / -1' }}>
            <legend className="form-field__label">Classes (select at least one)</legend>
            {classes.length === 0 && (
              <p className="empty-state">Create a class before creating a subject.</p>
            )}
            <div className="result-list">
              {classes.map((klass) => {
                const assignment = form.classAssignments.find((item) => item.classId === klass.id);
                return (
                  <div className="result-row" key={klass.id}>
                    <label className="result-row__meta">
                      <span>
                        <input
                          type="checkbox"
                          checked={Boolean(assignment)}
                          onChange={() => toggleClass(klass.id)}
                        />{' '}
                        <strong>
                          {klass.name}
                          {klass.section ? ` · ${klass.section}` : ''}
                        </strong>
                      </span>
                      <small>
                        {klass.gradeLevel?.name} · {klass.academicYear?.name}
                      </small>
                    </label>
                    {assignment && (
                      <input
                        aria-label={`Teaching focus for ${klass.name}`}
                        value={assignment.teachingFocus}
                        onChange={(event) => setTeachingFocus(klass.id, event.target.value)}
                        placeholder="Class-specific level or teaching focus"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              className="primary-button"
              disabled={saving || loading || form.classAssignments.length === 0}
              type="submit"
            >
              Create subject
            </button>
          </div>
        </form>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Subject catalog</h2>
            <p>All configured learning areas for the selected school.</p>
          </div>
          <span className="status-chip">{subjects.length} total</span>
        </div>

        {!loading && subjects.length === 0 && !error && (
          <p className="empty-state">No subjects found.</p>
        )}
        {subjects.length > 0 && (
          <div className="result-list">
            {subjects.map((subject) => (
              <article className="result-row" key={subject.id}>
                <span className="result-row__meta">
                  <strong>{subject.name}</strong>
                  <small>{subject.code}</small>
                  <small>
                    {(subject.classes ?? [])
                      .map(
                        (assignment) =>
                          `${assignment.class.name}${assignment.teachingFocus ? ` — ${assignment.teachingFocus}` : ''}`
                      )
                      .join(' · ')}
                  </small>
                </span>
                <span className="status-pill">{subject.status}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
