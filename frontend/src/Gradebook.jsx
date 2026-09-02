import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function Gradebook() {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/lms/classrooms')
      .then(({ data }) => {
        if (!active) return;
        const items = data.data ?? [];
        setClassrooms(items);
        setClassroomId(items[0]?.id || '');
      })
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load classes')))
      .finally(() => setBusy(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!classroomId) return setAssignments([]);
    setBusy(true);
    api
      .get('/lms/assignments', { params: { classroomId } })
      .then(({ data }) => {
        const items = data.data ?? [];
        setAssignments(items);
        setAssignmentId(items[0]?.id || '');
      })
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Unable to load assignments'))
      )
      .finally(() => setBusy(false));
  }, [classroomId]);

  const loadGrades = useCallback(async () => {
    if (!assignmentId) return setRows([]);
    setBusy(true);
    try {
      const { data } = await api.get('/lms/gradebook/grades', { params: { assignmentId } });
      const items = data.data ?? [];
      setRows(items);
      setDrafts(
        Object.fromEntries(
          items.map((row) => [
            row.id,
            {
              score: row.grade?.score ?? '',
              maxScore: row.grade?.maxScore ?? 100,
              summary: row.grade?.summary ?? '',
            },
          ])
        )
      );
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load gradebook'));
    } finally {
      setBusy(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        `${row.student.firstName} ${row.student.lastName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query, rows]
  );
  const update = (id, field, value) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));

  async function save(row) {
    const draft = drafts[row.id];
    try {
      await api.put(`/lms/gradebook/submissions/${row.id}/grade`, {
        score: Number(draft.score),
        maxScore: Number(draft.maxScore),
        summary: draft.summary || undefined,
        rubricScores: [],
      });
      toast.success('Draft grade saved');
      await loadGrades();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Unable to save grade'));
    }
  }

  async function release(row) {
    try {
      await api.post(`/lms/gradebook/grades/${row.grade.id}/release`);
      toast.success('Grade released to student');
      await loadGrades();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Unable to release grade'));
    }
  }

  return (
    <main className="gradebook-shell">
      <header className="gradebook-header">
        <div>
          <p className="eyebrow">Academic records</p>
          <h1>Gradebook</h1>
          <p>Review submitted work, save draft marks, and release feedback securely.</p>
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
        <label className="gradebook-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students"
          />
        </label>
      </section>
      {error && (
        <p className="error-state" role="alert">
          {error}
        </p>
      )}
      {busy && <p className="loading-state">Loading gradebook…</p>}
      {!busy && !visible.length && (
        <p className="empty-state">
          {assignmentId
            ? 'No submissions are ready for grading.'
            : 'Select a classroom and assignment to begin.'}
        </p>
      )}
      {!!visible.length && (
        <section className="gradebook-table-wrap">
          <table className="gradebook-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Maximum</th>
                <th>Feedback summary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>
                      {row.student.firstName} {row.student.lastName}
                    </strong>
                  </td>
                  <td>
                    <input
                      aria-label={`${row.student.firstName} score`}
                      type="number"
                      min="0"
                      value={drafts[row.id]?.score ?? ''}
                      onChange={(event) => update(row.id, 'score', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${row.student.firstName} maximum`}
                      type="number"
                      min="1"
                      value={drafts[row.id]?.maxScore ?? 100}
                      onChange={(event) => update(row.id, 'maxScore', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${row.student.firstName} feedback`}
                      value={drafts[row.id]?.summary ?? ''}
                      onChange={(event) => update(row.id, 'summary', event.target.value)}
                      placeholder="Actionable feedback"
                    />
                  </td>
                  <td>
                    <span className="status-pill">{row.grade?.status || 'UNGRADED'}</span>
                  </td>
                  <td className="gradebook-row-actions">
                    <button type="button" className="secondary-action" onClick={() => save(row)}>
                      <Check /> Save
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={!row.grade || row.grade.status === 'RELEASED'}
                      onClick={() => release(row)}
                    >
                      <Send /> Release
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
