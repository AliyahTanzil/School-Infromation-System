import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import { useAuth } from './context/AuthContext.jsx';

export default function FeedbackWorkspace() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isStudent = user?.accountType === 'STUDENT' || roles.includes('STUDENT');
  const isParent = user?.accountType === 'PARENT' || roles.includes('PARENT');
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [grades, setGrades] = useState([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isStudent) return;
    setBusy(true);
    api
      .get('/lms/classrooms')
      .then(({ data }) => {
        const items = data.data ?? [];
        setClassrooms(items);
        setClassroomId(items[0]?.id || '');
      })
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load classes')))
      .finally(() => setBusy(false));
  }, [isStudent]);

  useEffect(() => {
    if (!classroomId) return;
    api
      .get('/lms/assignments', { params: { classroomId, status: 'PUBLISHED' } })
      .then(({ data }) => {
        const items = data.data ?? [];
        setAssignments(items);
        setAssignmentId(items[0]?.id || '');
      })
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Unable to load assignments'))
      );
  }, [classroomId]);

  const load = useCallback(async () => {
    if (!assignmentId) return setGrades([]);
    setBusy(true);
    try {
      const { data } = await api.get('/lms/gradebook/grades', { params: { assignmentId } });
      setGrades(data.data ?? []);
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load feedback'));
    } finally {
      setBusy(false);
    }
  }, [assignmentId]);
  useEffect(() => {
    load();
  }, [load]);

  async function sendReply(gradeId) {
    if (!reply.trim()) return;
    try {
      await api.post(`/lms/gradebook/grades/${gradeId}/feedback`, { body: reply });
      setReply('');
      toast.success('Reply sent');
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Unable to send reply'));
    }
  }

  if (!isStudent)
    return (
      <main className="feedback-shell">
        <header className="feedback-header">
          <div>
            <p className="eyebrow">Assessment feedback</p>
            <h1>{isParent ? 'Learner feedback' : 'Feedback workspace'}</h1>
            <p>
              {isParent
                ? 'Linked-learner released feedback will be connected in the parent dashboard milestone.'
                : 'Teachers create and release feedback from the Gradebook.'}
            </p>
            {!isParent && (
              <a className="primary-action" href="/gradebook">
                Open gradebook
              </a>
            )}
          </div>
        </header>
      </main>
    );

  return (
    <main className="feedback-shell">
      <header className="feedback-header">
        <div>
          <p className="eyebrow">Student feedback center</p>
          <h1>My released feedback</h1>
          <p>Only grades released by your teacher are visible here.</p>
        </div>
      </header>
      <section className="gradebook-toolbar">
        <select
          aria-label="Classroom"
          value={classroomId}
          onChange={(event) => setClassroomId(event.target.value)}
        >
          <option value="">Select classroom</option>
          {classrooms.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Assignment"
          value={assignmentId}
          onChange={(event) => setAssignmentId(event.target.value)}
        >
          <option value="">Select assignment</option>
          {assignments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </section>
      {error && (
        <p className="error-state" role="alert">
          {error}
        </p>
      )}
      {busy && <p className="loading-state">Loading feedback…</p>}
      {!busy && assignmentId && !grades.length && (
        <p className="empty-state">No released feedback is available yet.</p>
      )}
      {grades.map((row) => (
        <article className="panel" key={row.id}>
          <div className="feedback-score-line">
            <span className="eyebrow">Released grade</span>
            <strong>
              {row.grade.score} / {row.grade.maxScore}
            </strong>
          </div>
          <h2>{assignments.find((item) => item.id === assignmentId)?.title || 'Assignment'}</h2>
          <p>{row.grade.summary || 'Your teacher has not added a summary.'}</p>
          {!!row.grade.rubricScores?.length && (
            <section className="rubric-card">
              <h3>Rubric scores</h3>
              {row.grade.rubricScores.map((item) => (
                <p key={item.criterionId}>
                  <strong>
                    {item.criterion.title}: {item.points} / {item.criterion.maxPoints}
                  </strong>
                  {item.comment ? ` — ${item.comment}` : ''}
                </p>
              ))}
            </section>
          )}
          <section className="feedback-thread">
            <h3>
              <MessageCircle /> Conversation
            </h3>
            {row.grade.feedback.map((item) => (
              <p key={item.id}>
                <strong>
                  {item.author.firstName} {item.author.lastName}
                </strong>
                <br />
                {item.body}
              </p>
            ))}
            <div className="gradebook-row-actions">
              <input
                aria-label="Reply to feedback"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Ask a question about this feedback"
              />
              <button
                className="primary-action"
                type="button"
                onClick={() => sendReply(row.grade.id)}
              >
                <Send /> Reply
              </button>
            </div>
          </section>
        </article>
      ))}
    </main>
  );
}
