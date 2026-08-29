import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, FileText, RotateCcw, Search, Send } from 'lucide-react';
import api from './api/auth.js';
import './classroom.css';
import './digital-classroom.css';

const errorMessage = (error) =>
  error.response?.data?.error?.message || error.message || 'Request failed';

export default function StudentSubmissionCenter() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('sais.schoolId') || '');
  const [classroomId, setClassroomId] = useState(
    () => sessionStorage.getItem('sais.classroomId') || ''
  );
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = schoolId ? { 'x-school-id': schoolId } : {};

  const load = useCallback(async () => {
    if (!schoolId || !classroomId) {
      setAssignments([]);
      setSubmissions([]);
      return;
    }
    setBusy(true);
    try {
      const [assignmentResponse, submissionResponse] = await Promise.all([
        api.get('/lms/assignments', {
          headers: { 'x-school-id': schoolId },
          params: { classroomId, status: 'PUBLISHED' },
        }),
        api.get('/lms/submissions', { headers: { 'x-school-id': schoolId } }),
      ]);
      setAssignments(assignmentResponse.data.data);
      setSubmissions(submissionResponse.data.data);
      setNotice('');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [classroomId, schoolId]);

  useEffect(() => {
    sessionStorage.setItem('sais.schoolId', schoolId);
    sessionStorage.setItem('sais.classroomId', classroomId);
    load();
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
      await api.post(
        '/lms/submissions',
        { assignmentId: selected.id, body: response, attachments: [], status },
        { headers }
      );
      setNotice(status === 'SUBMITTED' ? 'Work submitted for review.' : 'Draft version saved.');
      await load();
      setSelected(null);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function retract() {
    try {
      await api.patch(
        `/lms/submissions/${selected.submission.id}/status`,
        { status: 'DRAFT' },
        { headers }
      );
      setNotice('Submission retracted. You may now create a new version.');
      await load();
      setSelected(null);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

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
        <input
          value={schoolId}
          onChange={(event) => setSchoolId(event.target.value)}
          placeholder="School UUID"
          aria-label="School ID"
        />
        <input
          value={classroomId}
          onChange={(event) => setClassroomId(event.target.value)}
          placeholder="Classroom UUID"
          aria-label="Classroom ID"
        />
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
      {notice && <div className="dc-notice">{notice}</div>}

      <section className="work-layout">
        <div className="work-list">
          {!busy && schoolId && classroomId && !work.length && (
            <p>No published assignments found.</p>
          )}
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
