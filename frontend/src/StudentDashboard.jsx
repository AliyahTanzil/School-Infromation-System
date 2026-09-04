import { useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const emptyForm = {
  admissionNumber: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'UNSPECIFIED',
  email: '',
  phone: '',
};

export default function StudentDashboard() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadStudents = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/students', {
          params: { search: query },
          signal,
        });
        setStudents(response.data.data?.items ?? []);
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          setError(getApiErrorMessage(requestError, 'Unable to load students'));
        }
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const registerStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/students', {
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      toast.success('Student registered');
      setForm(emptyForm);
      setShowForm(false);
      await loadStudents();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Unable to register student'));
    } finally {
      setSaving(false);
    }
  };

  const summary = [
    { label: 'Total students', value: students.length || '0' },
    { label: 'Active enrolment', value: '94.8%' },
    { label: 'Pending review', value: '12' },
  ];

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Student information</span>
          <h1 className="page-header__title">Students</h1>
          <p className="page-header__subtitle">
            Manage admissions, enrollment, guardians, and student records.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <UserPlus size={17} /> Register student
        </button>
      </section>

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {summary.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="data-panel">
        <div className="data-toolbar">
          <label className="search-shell" aria-label="Search students">
            <Search size={17} aria-hidden="true" style={{ color: '#728196' }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or admission number"
              aria-label="Search students"
            />
          </label>

          <button type="button" className="secondary-button" onClick={() => setShowForm(true)}>
            Quick add
          </button>
        </div>

        {loading && <p className="loading-state">Loading students...</p>}
        {error && (
          <p className="error-state" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && students.length === 0 && (
          <p className="empty-state">No students found. Add a new record to begin enrollment.</p>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="student-list">
            {students.map((student) => (
              <a className="student-row" href={`/students/${student.id}`} key={student.id}>
                <span className="student-row__meta">
                  <strong className="student-row__name">
                    {student.firstName} {student.lastName}
                  </strong>
                  <small className="student-row__id">{student.admissionNumber}</small>
                </span>
                <span className="status-pill">{student.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="registration-modal-backdrop" role="presentation">
          <section
            className="registration-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
          >
            <button
              className="registration-modal__close"
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close registration form"
            >
              <X size={19} />
            </button>

            <div className="registration-modal__header">
              <span className="eyebrow">New admission</span>
              <h2 id="student-form-title">Register a student</h2>
              <p>
                Enter the learner’s core identity details. Enrollment and guardians can be added
                after registration.
              </p>
            </div>

            <form onSubmit={registerStudent}>
              <div className="form-grid">
                <label className="form-field">
                  <span className="form-field__label">Admission number</span>
                  <input
                    required
                    value={form.admissionNumber}
                    onChange={update('admissionNumber')}
                  />
                </label>

                <label className="form-field">
                  <span className="form-field__label">Date of birth</span>
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={update('dateOfBirth')}
                  />
                </label>

                <label className="form-field">
                  <span className="form-field__label">First name</span>
                  <input required value={form.firstName} onChange={update('firstName')} />
                </label>

                <label className="form-field">
                  <span className="form-field__label">Last name</span>
                  <input required value={form.lastName} onChange={update('lastName')} />
                </label>

                <label className="form-field">
                  <span className="form-field__label">Gender</span>
                  <select value={form.gender} onChange={update('gender')}>
                    <option value="UNSPECIFIED">Not specified</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-field__label">Email (optional)</span>
                  <input type="email" value={form.email} onChange={update('email')} />
                </label>

                <label className="form-field">
                  <span className="form-field__label">Phone (optional)</span>
                  <input value={form.phone} onChange={update('phone')} />
                </label>
              </div>

              <div
                className="student-form-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? 'Registering...' : 'Register student'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
