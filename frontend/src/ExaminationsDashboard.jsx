import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import { WorkspaceLoading } from './components/WorkspaceStates.jsx';
import { useSchoolContext } from './hooks/useSchoolContext.js';
import { examinationNextTask } from './examinationGuidance.js';
import ExaminationCandidates from './ExaminationCandidates.jsx';
import ExaminationSchedules from './ExaminationSchedules.jsx';

export default function ExaminationsDashboard() {
  const {
    schoolId,
    schoolName,
    loading: schoolLoading,
    error: schoolError,
    retry: retrySchool,
  } = useSchoolContext();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState(null);
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
      setError(null);
      try {
        const { data } = await api.get('/examinations', {
          signal,
        });
        if (signal?.aborted) return;
        if (!Array.isArray(data.data)) throw new Error('Unexpected examination response');
        setItems(data.data);
      } catch (reason) {
        if (!signal?.aborted) setError(reason);
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
      await api.post('/examinations', form);
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
      await api.patch(`/examinations/${item.id}/status`, {
        status: nextStatus,
        reason:
          nextStatus === 'IN_PROGRESS'
            ? 'School administration started the scheduled examination'
            : 'Examinations completed; school administration opened marking',
      });
      setNotice(
        nextStatus === 'IN_PROGRESS'
          ? `${item.name} is now in progress. Conduct the scheduled examinations before moving to marking.`
          : `${item.name} is now in marking. Prepare and check each candidateâ€™s subject marks.`
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
            <p>Prepare examinations for your configured school.</p>
          </div>
        </div>
        {schoolLoading && <WorkspaceLoading message="Loading school details..." />}
        {schoolError && (
          <p role="alert">
            {schoolError}{' '}
            <button className="secondary-button" onClick={retrySchool}>
              Retry school details
            </button>
          </p>
        )}
        {schoolId && <p>School: {schoolName}</p>}
        {!schoolLoading && !schoolError && !schoolId && (
          <p>
            <Link className="underline" to="/school-setup">
              Create your school
            </Link>{' '}
            before continuing.
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && (
          <p className="inline-alert" role="alert">
            {typeof error === 'string'
              ? error
              : getApiErrorMessage(error, 'Unable to load examinations')}
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
          <p className="loading-state">Loading examinationsâ€¦</p>
        ) : error || !schoolId ? null : items.length === 0 ? (
          <div className="empty-state">
            <h3>No examinations configured</h3>
            <p>
              Start with a draft using the form above. The register will show what to prepare next.
            </p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <div className="data-record-grid">
              {items.map((item) => (
                <article className="data-record-card" key={item.id}>
                  <div className="data-record-field">
                    <span className="data-record-label">Name</span>
                    <div>{item.name}</div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Code</span>
                    <div>{item.code}</div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Status</span>
                    <div>
                      <span className="status-chip">{item.status}</span>
                    </div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Candidates</span>
                    <div>{item._count?.candidates ?? 0}</div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Schedules</span>
                    <div>{item._count?.schedules ?? 0}</div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Marks</span>
                    <div>{item._count?.marks ?? 0}</div>
                  </div>
                  <div className="data-record-field">
                    <span className="data-record-label">Next step</span>
                    <div>
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
