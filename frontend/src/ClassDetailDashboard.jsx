import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function ClassDetailDashboard() {
  const { classId } = useParams();
  const [klass, setClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [classResponse, studentResponse, subjectResponse] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get('/students', { params: { status: 'ACTIVE', pageSize: 100 } }),
        api.get('/subjects', { params: { status: 'ACTIVE' } }),
      ]);
      setClass(classResponse.data.data);
      setStudents(studentResponse.data.data?.items ?? []);
      setSubjects(subjectResponse.data.data ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const enrolledIds = useMemo(
    () => new Set((klass?.enrollments ?? []).map((item) => item.studentId)),
    [klass]
  );
  const attachedSubjectIds = useMemo(
    () => new Set((klass?.subjects ?? []).map((item) => item.subjectId)),
    [klass]
  );

  const run = async (request) => {
    setSaving(true);
    setError('');
    try {
      await request();
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const activate = () => run(() => api.patch(`/classes/${classId}/status`, { status: 'ACTIVE' }));

  const enroll = (event) => {
    event.preventDefault();
    if (!studentId) return;
    run(async () => {
      await api.post(`/classes/${classId}/enrollments`, { studentId });
      setStudentId('');
    });
  };

  const attachSubject = (event) => {
    event.preventDefault();
    if (!subjectId) return;
    run(async () => {
      await api.post(`/classes/${classId}/subjects`, { subjectId });
      setSubjectId('');
    });
  };

  const createSubject = (event) => {
    event.preventDefault();
    if (!newSubject.name.trim()) return;
    run(async () => {
      await api.post(`/classes/${classId}/subjects`, {
        subject: {
          ...newSubject,
          code: newSubject.code || undefined,
          description: newSubject.description || undefined,
        },
      });
      setNewSubject({ name: '', code: '', description: '' });
    });
  };

  if (loading && !klass)
    return (
      <main className="page-shell">
        <p>Loading class…</p>
      </main>
    );

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">{klass?.school?.name ?? 'School class'}</span>
          <h1 className="page-header__title">
            {klass?.name}
            {klass?.section ? ` · ${klass.section}` : ''}
          </h1>
          <p className="page-header__subtitle">
            {klass?.code} · {klass?.gradeLevel?.name} · {klass?.academicYear?.name}
          </p>
        </div>
        <Link className="primary-button" to="/classes">
          Back to classes
        </Link>
      </section>

      {error && (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      )}

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card__label">Status</div>
          <div className="stat-card__value">{klass?.status}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Students</div>
          <div className="stat-card__value">
            {klass?.enrollments?.length ?? 0} / {klass?.capacity}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Subjects</div>
          <div className="stat-card__value">{klass?.subjects?.length ?? 0}</div>
        </div>
      </section>

      {klass?.status === 'PLANNED' && (
        <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="section-heading">
            <div>
              <h2>Activate this class</h2>
              <p>Students can be enrolled after the class is active.</p>
            </div>
          </div>
          <button className="primary-button" type="button" disabled={saving} onClick={activate}>
            Activate class
          </button>
        </section>
      )}

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>Students</h2>
            <p>Add active students from this school to the class.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={enroll}>
          <label className="form-field">
            <span>Student</span>
            <select
              required
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Select student</option>
              {students
                .filter((item) => !enrolledIds.has(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.profile?.firstName} {item.profile?.lastName} · {item.admissionNumber}
                  </option>
                ))}
            </select>
          </label>
          <div>
            <button
              className="primary-button"
              disabled={saving || klass?.status !== 'ACTIVE'}
              type="submit"
            >
              Add student
            </button>
          </div>
        </form>
        <div className="result-list">
          {klass?.enrollments?.map(({ student }) => (
            <article className="result-row" key={student.id}>
              <span className="result-row__meta">
                <strong>
                  {student.profile?.firstName} {student.profile?.lastName}
                </strong>
                <small>{student.admissionNumber}</small>
              </span>
              <span className="status-pill">{student.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Subjects</h2>
            <p>Attach an existing school subject or create one directly for this class.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={attachSubject} style={{ marginBottom: '1.5rem' }}>
          <label className="form-field">
            <span>Existing subject</span>
            <select
              required
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">Select subject</option>
              {subjects
                .filter((item) => !attachedSubjectIds.has(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.code}
                  </option>
                ))}
            </select>
          </label>
          <div>
            <button className="primary-button" disabled={saving} type="submit">
              Attach subject
            </button>
          </div>
        </form>
        <form className="form-grid" onSubmit={createSubject}>
          <label className="form-field">
            <span>New subject name</span>
            <input
              required
              value={newSubject.name}
              onChange={(event) => setNewSubject({ ...newSubject, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Code</span>
            <input
              value={newSubject.code}
              placeholder="Auto-generated if blank"
              onChange={(event) => setNewSubject({ ...newSubject, code: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Description</span>
            <input
              value={newSubject.description}
              onChange={(event) =>
                setNewSubject({ ...newSubject, description: event.target.value })
              }
            />
          </label>
          <div>
            <button className="primary-button" disabled={saving} type="submit">
              Create and attach subject
            </button>
          </div>
        </form>
        <div className="result-list">
          {klass?.subjects?.map(({ subject }) => (
            <article className="result-row" key={subject.id}>
              <span className="result-row__meta">
                <strong>{subject.name}</strong>
                <small>
                  {subject.code}
                  {subject.description ? ` · ${subject.description}` : ''}
                </small>
              </span>
              <span className="status-pill">{subject.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
