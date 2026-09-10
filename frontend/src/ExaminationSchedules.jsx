/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

function localDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ExaminationSchedules({
  schoolId,
  examination,
  onSaved,
  onBusy,
  onCandidates,
}) {
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [scheduled, setScheduled] = useState(false);
  const [classId, setClassId] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const config = { headers: { 'x-school-id': schoolId }, signal: controller.signal };
    setLoading(true);
    setError('');
    async function load() {
      try {
        const { data } = await api.get(`/examinations/${examination.id}`, config);
        if (controller.signal.aborted) return;
        const exam = data.data;
        if (exam?.status !== 'DRAFT')
          throw new Error(
            'This examination is no longer a draft. Reload examinations before continuing.'
          );
        if (!Array.isArray(exam.candidates) || !Array.isArray(exam.schedules))
          throw new Error('Unable to read examination preparation records');
        const ids = [...new Set(exam.candidates.map((candidate) => candidate.classId))];
        const records = await Promise.all(
          ids.map(async (id) => {
            const response = await api.get(`/classes/${id}`, config);
            if (!response.data.data?.id || !Array.isArray(response.data.data.subjects))
              throw new Error('Unable to read class subjects');
            return response.data.data;
          })
        );
        if (controller.signal.aborted) return;
        setClasses(records);
        setSchedules(exam.schedules);
        setCandidates(exam.candidates);
        setClassId('');
        setSubjectCode('');
        setScheduledAt('');
      } catch (reason) {
        if (!controller.signal.aborted)
          setError(getApiErrorMessage(reason, 'Unable to load subject scheduling'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [schoolId, examination.id, refresh]);
  const selectedClass = classes.find((item) => item.id === classId);
  const subjects = (selectedClass?.subjects ?? [])
    .map((item) => item.subject)
    .filter((subject) => subject?.status === 'ACTIVE' && subject.code);
  const existing = schedules.find(
    (item) => item.classId === classId && item.subjectCode === subjectCode
  );
  const unsavedSchedule =
    !!subjectCode && (!existing || scheduledAt !== localDateTime(existing.scheduledAt));
  const missingClasses = classes.filter(
    (item) => !schedules.some((schedule) => schedule.classId === item.id)
  );
  const canSchedule =
    candidates.length > 0 && schedules.length > 0 && !missingClasses.length && !unsavedSchedule;
  const markScheduled = async () => {
    if (!canSchedule || saving || loading || error || scheduled) return;
    setSaving(true);
    onBusy(true);
    try {
      await api.patch(
        `/examinations/${examination.id}/status`,
        {
          status: 'SCHEDULED',
          reason: 'Candidate classes and subject schedules reviewed by school administration',
        },
        { headers: { 'x-school-id': schoolId } }
      );
      setScheduled(true);
      await onSaved(
        'Examination scheduled. Confirm the candidate register and dates before the examination begins.'
      );
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to schedule examination'));
    } finally {
      setSaving(false);
      onBusy(false);
    }
  };
  const save = async (event) => {
    event.preventDefault();
    if (
      saving ||
      loading ||
      error ||
      !selectedClass ||
      !subjects.some((subject) => subject.code === subjectCode) ||
      !scheduledAt
    )
      return;
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) return setError('Enter a valid examination date and time.');
    setSaving(true);
    onBusy(true);
    try {
      await api.post(
        `/examinations/${examination.id}/schedules`,
        { classId, subjectCode, scheduledAt: date.toISOString() },
        { headers: { 'x-school-id': schoolId } }
      );
      await onSaved();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to save subject schedule'));
    } finally {
      setSaving(false);
      onBusy(false);
    }
  };
  return (
    <section className="data-panel mb-6" aria-labelledby="exam-schedule-title">
      <h2 id="exam-schedule-title">Schedule subjects: {examination.name}</h2>
      <p className="my-2">
        Choose a class with registered candidates, select one of its active subjects, and set the
        examination date and time.
      </p>
      {scheduled ? (
        <p role="status">
          Examination scheduled. Confirm the candidate register and dates before the examination
          begins.
        </p>
      ) : loading ? (
        <p role="status">Loading subject scheduling…</p>
      ) : error ? (
        <p role="alert">
          {error}{' '}
          <button className="secondary-button" onClick={() => setRefresh((value) => value + 1)}>
            Retry subject scheduling
          </button>
        </p>
      ) : (
        <>
          {!classes.length ? (
            <p>
              Register candidates before scheduling their subjects.{' '}
              <button className="secondary-button" onClick={onCandidates}>
                Register candidates first
              </button>
            </p>
          ) : (
            <form className="form-grid" onSubmit={save}>
              <label className="form-field">
                Examination class
                <select
                  required
                  value={classId}
                  disabled={saving}
                  onChange={(event) => {
                    setClassId(event.target.value);
                    setSubjectCode('');
                    setScheduledAt('');
                  }}
                >
                  <option value="">Select a candidate class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.section ? ` · ${item.section}` : ''}
                      {item.academicYear?.name ? ` (${item.academicYear.name})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Examination subject
                <select
                  required
                  value={subjectCode}
                  disabled={!classId || saving}
                  onChange={(event) => {
                    const code = event.target.value;
                    setSubjectCode(code);
                    const saved = schedules.find(
                      (item) => item.classId === classId && item.subjectCode === code
                    );
                    setScheduledAt(saved ? localDateTime(saved.scheduledAt) : '');
                  }}
                >
                  <option value="">Select a class subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.code}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Examination date and time
                <input
                  required
                  type="datetime-local"
                  value={scheduledAt}
                  disabled={saving || !subjectCode}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>
              <p className="text-sm">
                Times use your device time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}.
              </p>
              {existing && (
                <p>
                  This class and subject already have a schedule. Saving updates its date and time.
                </p>
              )}
              <button className="primary-button" disabled={saving || !subjectCode || !scheduledAt}>
                {existing ? 'Update subject schedule' : 'Save subject schedule'}
              </button>
            </form>
          )}
          {classId && !subjects.length && (
            <p className="mt-3">
              This class has no active subjects.{' '}
              <Link className="underline" to={`/classes/${classId}`}>
                Attach subjects to this class
              </Link>
              , then retry subject scheduling.
            </p>
          )}
          <button
            className="secondary-button my-3"
            disabled={saving}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Refresh scheduling records
          </button>
          <h3 className="font-semibold">Saved subject schedules</h3>
          {!schedules.length ? (
            <p>No subject schedules saved yet.</p>
          ) : (
            <ul className="my-3 space-y-2">
              {schedules.map((item) => (
                <li key={item.id ?? `${item.classId}:${item.subjectCode}`}>
                  {classes.find((klass) => klass.id === item.classId)?.name ??
                    'Class without registered candidates'}{' '}
                  · {item.subjectCode} · {new Date(item.scheduledAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
          {!!schedules.length && (
            <p>
              Review all candidate classes and required subjects before moving the examination to
              scheduled status. A saved schedule does not confirm full coverage or resolve clashes.
            </p>
          )}
          <section
            className="mt-5 rounded-xl border border-slate-300 p-4"
            aria-labelledby="exam-review-title"
          >
            <h3 id="exam-review-title" className="font-semibold">
              Review before scheduling
            </h3>
            <p className="my-2">
              {candidates.length} registered candidate(s) across {classes.length} class(es);{' '}
              {schedules.length} saved subject schedule(s).
            </p>
            <ul className="my-3 space-y-2">
              {classes.map((item) => {
                const saved = schedules.filter((schedule) => schedule.classId === item.id);
                return (
                  <li key={item.id}>
                    <strong>
                      {item.name}
                      {item.section ? ` · ${item.section}` : ''}
                    </strong>
                    : {candidates.filter((candidate) => candidate.classId === item.id).length}{' '}
                    candidate(s).{' '}
                    {saved.length
                      ? `Scheduled subjects: ${saved.map((schedule) => schedule.subjectCode).join(', ')}.`
                      : 'Add a subject schedule for this class.'}
                  </li>
                );
              })}
            </ul>
            {!candidates.length && <p>Register candidates first.</p>}
            {!!candidates.length && !!missingClasses.length && (
              <p>Each candidate class needs a saved subject schedule before you continue.</p>
            )}
            {unsavedSchedule && (
              <p>
                Save your subject schedule changes, or clear the subject selection, before
                continuing.
              </p>
            )}
            <p className="my-2">
              Check that all intended candidates and subjects are included and the dates are
              correct. Moving to Scheduled ends draft subject editing.
            </p>
            <button
              className="primary-button"
              disabled={!canSchedule || saving}
              onClick={markScheduled}
            >
              Mark examination as scheduled
            </button>
          </section>
        </>
      )}
    </section>
  );
}
