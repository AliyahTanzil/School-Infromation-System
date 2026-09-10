import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import useSchoolSelection from './hooks/useSchoolSelection.js';
import { examinationNextTask } from './examinationGuidance.js';
import ExaminationCandidates from './ExaminationCandidates.jsx';
import ExaminationSchedules from './ExaminationSchedules.jsx';

const requestHeaders = (schoolId) => ({
  'x-school-id': schoolId,
});
export default function ExaminationsDashboard() {
  const {
    schools,
    schoolId,
    setSchoolId,
    loading: schoolsLoading,
    error: schoolsError,
    retry,
  } = useSchoolSelection();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [candidateExamId, setCandidateExamId] = useState('');
  const [scheduleExamId, setScheduleExamId] = useState('');
  const scheduleExam = items.find((item) => item.id === scheduleExamId && item.status === 'DRAFT');
  const candidateExam = items.find(
    (item) => item.id === candidateExamId && item.status === 'DRAFT'
  );
  const load = useCallback(
    async (signal) => {
      if (!schoolId) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/examinations', {
          headers: requestHeaders(schoolId),
          signal,
        });
        if (signal?.aborted) return;
        if (!Array.isArray(data.data)) throw new Error('Unexpected examination response');
        setItems(data.data);
        sessionStorage.setItem('schoolId', schoolId);
      } catch (reason) {
        if (!signal?.aborted) setError(getApiErrorMessage(reason, 'Unable to load examinations'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [schoolId]
  );
  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setForm({ name: '', code: '' });
    setError('');
    setNotice('');
    setCandidateExamId('');
    setScheduleExamId('');
    setLoading(false);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    if (!schoolId || saving) return;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await api.post('/examinations', form, { headers: requestHeaders(schoolId) });
      setForm({ name: '', code: '' });
      setNotice('Examination draft saved. Review its next step in the exam cycles below.');
      await load();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to create examination'));
    } finally {
      setSaving(false);
    }
  };
  const advanceExamination = async (item) => {
    const nextStatus = { SCHEDULED: 'IN_PROGRESS', IN_PROGRESS: 'MARKING' }[item.status];
    if (!nextStatus || !schoolId || saving || loading) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.patch(
        `/examinations/${item.id}/status`,
        {
          status: nextStatus,
          reason:
            nextStatus === 'IN_PROGRESS'
              ? 'School administration started the scheduled examination'
              : 'Examinations completed; school administration opened marking',
        },
        { headers: requestHeaders(schoolId) }
      );
      setNotice(
        nextStatus === 'IN_PROGRESS'
          ? `${item.name} is now in progress. Conduct the scheduled examinations before moving to marking.`
          : `${item.name} is now in marking. Prepare and check each candidate’s subject marks.`
      );
      await load();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to update examination status'));
    } finally {
      setSaving(false);
    }
  };
  const summary = [
    { label: 'Exam cycles', value: items.length },
    { label: 'Draft cycles', value: items.filter((item) => item.status === 'DRAFT').length },
    { label: 'Locked', value: items.filter((item) => item.status === 'LOCKED').length },
  ];

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic operations</p>
          <h1 className="page-header__title">Examinations</h1>
          <p className="page-header__subtitle">
            Configure candidate registers, subject schedules, marking, moderation, approval, and
            locking.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </header>

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
            <p>Select the school whose examinations you want to prepare.</p>
          </div>
        </div>
        <div className="form-field" style={{ maxWidth: '26rem' }}>
          <label className="form-field__label" htmlFor="examination-school">
            School
          </label>
          <select
            id="examination-school"
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            disabled={schoolsLoading || loading || saving}
          >
            <option value="">{schoolsLoading ? 'Loading schools…' : 'Select your school'}</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        {schoolsError && (
          <p role="alert">
            {schoolsError}{' '}
            <button className="secondary-button" onClick={retry}>
              Retry schools
            </button>
          </p>
        )}
        {!schoolsLoading && !schoolsError && !schools.length && (
          <p>
            <Link className="underline" to="/school-setup">
              Create your school
            </Link>{' '}
            before setting up examinations.
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && (
          <p className="inline-alert" role="alert">
            {error}
            <button
              className="secondary-button"
              disabled={loading || saving}
              onClick={() => load()}
            >
              Reload examinations
            </button>
          </p>
        )}
      </section>

      <section className="data-panel mb-6" aria-label="Examination setup guidance">
        <h2 className="text-xl font-semibold">Prepare examinations, step by step</h2>
        <ol className="my-3 list-decimal pl-5">
          <li>
            <Link className="underline" to="/academic-policies">
              Review grading policies
            </Link>{' '}
            and their effective dates.
          </li>
          <li>
            <Link className="underline" to="/classes">
              Prepare classes
            </Link>
            , enroll students, and attach subjects.
          </li>
          <li>Create an examination draft with a clear name and unique code.</li>
          <li>
            Prepare candidates and subject schedules, then complete marking, moderation, approval,
            and locking.
          </li>
        </ol>
        <p className="text-sm">
          Create a draft, register candidates, then schedule their subjects using the exam register
          below. Marking controls are not yet available here.
        </p>
        {schoolId && !loading && !error && !items.length && (
          <p className="mt-3">
            <a className="underline font-semibold" href="#examination-draft">
              Next: Create your first examination draft
            </a>
          </p>
        )}
      </section>

      <section id="examination-draft" className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>New examination cycle</h2>
            <p>Start a draft cycle and prepare it for candidates, marks, and approval.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={create}>
          <label className="form-field">
            <span className="form-field__label">Examination name</span>
            <input
              required
              aria-label="Examination name"
              placeholder="Examination name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Unique code</span>
            <input
              required
              aria-label="Examination code"
              placeholder="Unique code"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              className="primary-button"
              disabled={!schoolId || loading || saving || !!error}
              type="submit"
            >
              Create draft
            </button>
          </div>
        </form>
      </section>

      {candidateExam && !loading && !error && (
        <ExaminationCandidates
          key={`${schoolId}:${candidateExam.id}`}
          schoolId={schoolId}
          examination={candidateExam}
          onBusy={setSaving}
          onSaved={async () => {
            setNotice('Candidate registered. Continue with the remaining students and classes.');
            await load();
          }}
        />
      )}

      {scheduleExam && !loading && !error && (
        <ExaminationSchedules
          key={`${schoolId}:${scheduleExam.id}`}
          schoolId={schoolId}
          examination={scheduleExam}
          onBusy={setSaving}
          onCandidates={() => {
            setCandidateExamId(scheduleExam.id);
            setScheduleExamId('');
          }}
          onSaved={async (message) => {
            setNotice(
              message || 'Subject schedule saved. Review the remaining classes and subjects.'
            );
            await load();
          }}
        />
      )}

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Exam cycles</h2>
            <p>Tenant and school-scoped examination workflows.</p>
          </div>
          <span className="status-chip">{items.length} total</span>
        </div>

        {loading ? (
          <p className="loading-state">Loading examinations…</p>
        ) : error || !schoolId ? null : items.length === 0 ? (
          <div className="empty-state">
            <h3>No examinations configured</h3>
            <p>
              Start with a draft using the form above. The register will show what to prepare next.
            </p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Candidates</th>
                  <th>Schedules</th>
                  <th>Marks</th>
                  <th>Next step</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.code}</td>
                    <td>
                      <span className="status-chip">{item.status}</span>
                    </td>
                    <td>{item._count?.candidates ?? 0}</td>
                    <td>{item._count?.schedules ?? 0}</td>
                    <td>{item._count?.marks ?? 0}</td>
                    <td>
                      <p>{examinationNextTask(item)}</p>
                      {['SCHEDULED', 'IN_PROGRESS'].includes(item.status) && (
                        <button
                          className="primary-button"
                          disabled={saving}
                          onClick={() => advanceExamination(item)}
                        >
                          {item.status === 'SCHEDULED'
                            ? `Start examination: ${item.name}`
                            : `Open marking: ${item.name}`}
                        </button>
                      )}
                      {item.status === 'DRAFT' && (
                        <button
                          className="secondary-button"
                          disabled={saving}
                          onClick={() => {
                            setCandidateExamId(item.id);
                            setScheduleExamId('');
                          }}
                        >
                          Register candidates for {item.name}
                        </button>
                      )}
                      {item.status === 'DRAFT' && (
                        <button
                          className="secondary-button"
                          disabled={saving}
                          onClick={() => {
                            setScheduleExamId(item.id);
                            setCandidateExamId('');
                          }}
                        >
                          Schedule subjects for {item.name}
                        </button>
                      )}
                      {item.status === 'LOCKED' && (
                        <Link className="underline font-semibold" to="/results">
                          Open result management
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
