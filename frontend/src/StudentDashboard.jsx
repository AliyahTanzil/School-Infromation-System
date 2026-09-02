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

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Student information</span>
          <h1>Students</h1>
          <p>Manage admissions, enrollment, guardians, and student records.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <UserPlus size={17} /> Register student
        </button>
      </section>
      <section className="panel student-directory">
        <label className="search-field">
          <span className="sr-only">Search students</span>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or admission number"
          />
        </label>
        {loading && <p className="loading-state">Loading students...</p>}
        {error && (
          <p className="error-state" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && students.length === 0 && (
          <p className="empty-state">No students found.</p>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="student-list">
            {students.map((student) => (
              <a className="student-row" href={`/students/${student.id}`} key={student.id}>
                <span>
                  <strong>
                    {student.firstName} {student.lastName}
                  </strong>
                  <small>{student.admissionNumber}</small>
                </span>
                <span className="status-pill">{student.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>
      {showForm && (
        <div className="student-modal-backdrop" role="presentation">
          <section
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
          >
            <button
              className="student-modal-close"
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close registration form"
            >
              <X size={19} />
            </button>
            <span className="eyebrow">New admission</span>
            <h2 id="student-form-title">Register a student</h2>
            <p>
              Enter the learner’s core identity details. Enrollment and guardians can be added after
              registration.
            </p>
            <form className="student-form" onSubmit={registerStudent}>
              <label>
                <span>Admission number</span>
                <input required value={form.admissionNumber} onChange={update('admissionNumber')} />
              </label>
              <div className="student-form-grid">
                <label>
                  <span>First name</span>
                  <input required value={form.firstName} onChange={update('firstName')} />
                </label>
                <label>
                  <span>Last name</span>
                  <input required value={form.lastName} onChange={update('lastName')} />
                </label>
                <label>
                  <span>Date of birth</span>
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={update('dateOfBirth')}
                  />
                </label>
                <label>
                  <span>Gender</span>
                  <select value={form.gender} onChange={update('gender')}>
                    <option value="UNSPECIFIED">Not specified</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>
                  <span>Email (optional)</span>
                  <input type="email" value={form.email} onChange={update('email')} />
                </label>
                <label>
                  <span>Phone (optional)</span>
                  <input value={form.phone} onChange={update('phone')} />
                </label>
              </div>
              <div className="student-form-actions">
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
