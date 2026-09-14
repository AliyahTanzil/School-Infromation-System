import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, FileText, RotateCcw, Search, Send } from 'lucide-react';
import api from './api/auth.js';
import { useSchoolContext } from './hooks/useSchoolContext.js';
import { WorkspaceLoading, WorkspaceEmpty, WorkspaceError } from './components/WorkspaceStates.jsx';
import './classroom.css';
import './digital-classroom.css';

const errorMessage = (error) =>
  error.response?.data?.error?.message || error.message || 'Request failed';

export default function StudentSubmissionCenter() {
  const {
    schoolId,
    loading: schoolLoading,
    error: schoolError,
    retry: retrySchool,
  } = useSchoolContext();
  const [classroomId, setClassroomId] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const [classroomsError, setClassroomsError] = useState('');
  const [classroomsAttempt, setClassroomsAttempt] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (schoolLoading || schoolError || !schoolId) return;
    const controller = new AbortController();
    setClassroomsLoading(true);
    setClassroomsError('');
    setClassroomId('');
    setClassrooms([]);
    api
      .get('/lms/classrooms', { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const rooms = data.data ?? [];
        setClassrooms(rooms);
        setClassroomId(rooms[0]?.id ?? '');
      })
      .catch((error) => {
        if (!controller.signal.aborted) setClassroomsError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setClassroomsLoading(false);
      });
    return () => controller.abort();
  }, [schoolId, schoolLoading, schoolError, classroomsAttempt]);

  const load = useCallback(
    async (signal) => {
      if (schoolLoading || schoolError || !schoolId || !classroomId) {
        setAssignments([]);
        setSubmissions([]);
        return;
      }
      setBusy(true);
      try {
        const [assignmentResponse, submissionResponse] = await Promise.all([
          api.get('/lms/assignments', {
            signal,
            params: { classroomId, status: 'PUBLISHED' },
          }),
          api.get('/lms/submissions', { signal }),
        ]);
        if (signal?.aborted) return;
        setAssignments(assignmentResponse.data.data);
        setSubmissions(submissionResponse.data.data);
        setNotice('');
      } catch (error) {
        if (!signal?.aborted) setNotice(errorMessage(error));
      } finally {
        if (!signal?.aborted) setBusy(false);
      }
    },
    [classroomId, schoolId, schoolLoading, schoolError]
  );

  useEffect(() => {
    const controller = new AbortController();
    setAssignments([]);
    setSubmissions([]);
    setSelected(null);
    setNotice('');
    load(controller.signal);
    return () => controller.abort();
  }, [classroomId, load, schoolId]);

  const work = useMemo(
    () =>
      assignments
        .map((assignment) => ({
          ...assignment,
          submission: submissions.find((item) => item.assignmentId === assignment.id),
        }))
        .filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [assignments, query, submissions]
  );

  function openWork(item) {
    setSelected(item);
    setResponse(item.submission?.versions?.[0]?.body || '');
    setNotice('');
  }

  async function save(status) {
    if (!response.trim()) return setNotice('Write a response before saving.');
    try {
      await api.post('/lms/submissions', {
        assignmentId: selected.id,
        body: response,
        attachments: [],
        status,
      });
      setNotice(status === 'SUBMITTED' ? 'Work submitted for review.' : 'Draft version saved.');
      await load();
      setSelected(null);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function retract() {
    try {
      await api.patch(`/lms/submissions/${selected.submission.id}/status`, { status: 'DRAFT' });
      setNotice('Submission retracted. You may now create a new version.');
      await load();
      setSelected(null);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  if (schoolLoading) return <WorkspaceLoading message="Loading school details..." />;
  if (schoolError) return <WorkspaceError message={schoolError} onRetry={retrySchool} />;
  if (!schoolId)
    return (
      <WorkspaceEmpty
        title="School setup required"
        message="Contact your school administrator to complete school setup."
      />
    );

  return (
    <main className="submission-center-shell">
      <header className="submission-center-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>My work</h1>
          <p>Save immutable draft versions, submit work, and review your submission history.</p>
        </div>
      </header>

      <div className="work-toolbar">
        <select
          value={classroomId}
          onChange={(event) => {
            setSelected(null);
            setAssignments([]);
            setSubmissions([]);
            setClassroomId(event.target.value);
          }}
          aria-label="Classroom"
          disabled={classroomsLoading || Boolean(classroomsError) || !classrooms.length}
        >
          {!classrooms.length && <option value="">Select a classroom</option>}
          {classrooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <label className="materials-search">
          <Search />
          <input
            aria-label="Search my work"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assignments..."
          />
        </label>
      </div>
      {classroomsLoading ? (
        <WorkspaceLoading message="Loading classrooms..." />
      ) : classroomsError ? (
        <WorkspaceError
          message={classroomsError}
          onRetry={() => setClassroomsAttempt((value) => value + 1)}
        />
      ) : !classrooms.length ? (
        <WorkspaceEmpty
          title="No accessible classrooms"
          message="Your classrooms will appear here when your school adds you."
        />
      ) : null}
      {busy && classroomId && <p role="status">Loading assignments...</p>}
      {notice && <div className="dc-notice">{notice}</div>}

      <section className="work-layout">
        <div className="work-list">
          {!busy && schoolId && classroomId && !work.length && (
            <p>No published assignments found.</p>
          )}
          <div className="data-record-grid">
            {work.map((item) => (
              <button
                className="work-card"
                key={item.id}
                onClick={() => openWork(item)}
                type="button"
              >
                <span className="classwork-icon">
                  <FileText />
                </span>
                <span className="work-card-body">
                  <span className="item-type">{item.type}</span>
                  <strong>{item.title}</strong>
                  <small>
                    <Clock3 />{' '}
                    {item.dueAt ? `Due ${new Date(item.dueAt).toLocaleString()}` : 'No due date'} ·{' '}
                    {item.points} points
                  </small>
                </span>
                <span className="status-badge">{item.submission?.status || 'NOT STARTED'}</span>
                <ArrowRight />
              </button>
            ))}
          </div>
        </div>
        <aside className="work-upcoming">
          <p className="eyebrow">Version history</p>
          <h2>Your work remains traceable.</h2>
          <p>
            Every save creates an immutable version. Submitted work must be retracted before
            editing.
          </p>
        </aside>
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal work-detail-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close assignment detail"
              onClick={() => setSelected(null)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">{selected.type}</p>
            <h2>{selected.title}</h2>
            <p className="modal-copy">
              {selected.instructions || selected.description || 'Complete the assigned work.'}
            </p>
            <textarea
              aria-label="Assignment response"
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Write your response here..."
              disabled={selected.submission?.status === 'SUBMITTED'}
            />
            <div className="student-submit-actions">
              {selected.submission?.status === 'SUBMITTED' ? (
                <button className="secondary-action" type="button" onClick={retract}>
                  Retract submission <RotateCcw />
                </button>
              ) : (
                <>
                  <button className="secondary-action" type="button" onClick={() => save('DRAFT')}>
                    Save draft
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => save('SUBMITTED')}
                  >
                    Submit work <Send />
                  </button>
                </>
              )}
            </div>
            {!!selected.submission?.versions?.length && (
              <div className="student-response">
                <span>Saved versions</span>
                {selected.submission.versions.map((version) => (
                  <p key={version.id}>
                    Version {version.version} · {new Date(version.createdAt).toLocaleString()}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
