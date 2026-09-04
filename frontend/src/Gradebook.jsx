import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function Gradebook() {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [showRubric, setShowRubric] = useState(false);
  const [rubric, setRubric] = useState({
    title: '',
    description: '',
    criteria: [{ title: '', maxPoints: 10 }],
  });

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
    Promise.all([
      api.get('/lms/assignments', { params: { classroomId } }),
      api.get('/lms/gradebook/rubrics', { params: { classroomId } }),
    ])
      .then(([assignmentResponse, rubricResponse]) => {
        const items = assignmentResponse.data.data ?? [];
        setAssignments(items);
        setRubrics(rubricResponse.data.data ?? []);
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
              maxScore: (row.grade?.maxScore ?? row.assignment.points) || 100,
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
  const activeRubric = rubrics.find(
    (item) => item.id === assignments.find((entry) => entry.id === assignmentId)?.rubricId
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
        rubricScores: (activeRubric?.criteria ?? []).map((criterion) => ({
          criterionId: criterion.id,
          points: Number(draft.rubricScores?.[criterion.id] ?? 0),
        })),
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

  async function createRubric(event) {
    event.preventDefault();
    try {
      const { data } = await api.post('/lms/gradebook/rubrics', { ...rubric, classroomId });
      await api.patch(`/lms/gradebook/rubrics/${data.data.id}/status`, { status: 'PUBLISHED' });
      if (assignmentId)
        await api.patch(`/lms/gradebook/assignments/${assignmentId}/rubric`, {
          rubricId: data.data.id,
        });
      setRubrics((items) => [{ ...data.data, status: 'PUBLISHED' }, ...items]);
      setRubric({ title: '', description: '', criteria: [{ title: '', maxPoints: 10 }] });
      setShowRubric(false);
      toast.success('Rubric created and assigned');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Unable to create rubric'));
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
        <select
          aria-label="Assignment rubric"
          disabled={!assignmentId}
          value={assignments.find((item) => item.id === assignmentId)?.rubricId || ''}
          onChange={async (event) => {
            try {
              await api.patch(`/lms/gradebook/assignments/${assignmentId}/rubric`, {
                rubricId: event.target.value || null,
              });
              setAssignments((items) =>
                items.map((item) =>
                  item.id === assignmentId
                    ? { ...item, rubricId: event.target.value || null }
                    : item
                )
              );
              toast.success('Assignment rubric updated');
            } catch (requestError) {
              toast.error(getApiErrorMessage(requestError, 'Unable to assign rubric'));
            }
          }}
        >
          <option value="">No rubric</option>
          {rubrics
            .filter((item) => item.status !== 'ARCHIVED')
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
        </select>
        <button
          type="button"
          className="secondary-action"
          disabled={!classroomId}
          onClick={() => setShowRubric(true)}
        >
          <Plus /> New rubric
        </button>
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
                    {activeRubric?.criteria.map((criterion) => (
                      <label className="rubric-score-input" key={criterion.id}>
                        <span>
                          {criterion.title} / {criterion.maxPoints}
                        </span>
                        <input
                          aria-label={`${row.student.firstName} ${criterion.title}`}
                          type="number"
                          min="0"
                          max={criterion.maxPoints}
                          value={
                            drafts[row.id]?.rubricScores?.[criterion.id] ??
                            row.grade?.rubricScores?.find(
                              (item) => item.criterionId === criterion.id
                            )?.points ??
                            ''
                          }
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [row.id]: {
                                ...current[row.id],
                                rubricScores: {
                                  ...current[row.id]?.rubricScores,
                                  [criterion.id]: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
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
      {showRubric && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rubric-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close rubric form"
              onClick={() => setShowRubric(false)}
            >
              <X />
            </button>
            <p className="eyebrow">Reusable scoring guide</p>
            <h2 id="rubric-title">Create rubric</h2>
            <form className="student-form" onSubmit={createRubric}>
              <label>
                <span>Title</span>
                <input
                  required
                  value={rubric.title}
                  onChange={(event) =>
                    setRubric((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  value={rubric.description}
                  onChange={(event) =>
                    setRubric((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
              {rubric.criteria.map((criterion, index) => (
                <div className="student-form-grid" key={index}>
                  <label>
                    <span>Criterion {index + 1}</span>
                    <input
                      required
                      value={criterion.title}
                      onChange={(event) =>
                        setRubric((current) => ({
                          ...current,
                          criteria: current.criteria.map((item, position) =>
                            position === index ? { ...item, title: event.target.value } : item
                          ),
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Maximum points</span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={criterion.maxPoints}
                      onChange={(event) =>
                        setRubric((current) => ({
                          ...current,
                          criteria: current.criteria.map((item, position) =>
                            position === index
                              ? { ...item, maxPoints: Number(event.target.value) }
                              : item
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
              <div className="gradebook-row-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    setRubric((current) => ({
                      ...current,
                      criteria: [...current.criteria, { title: '', maxPoints: 10 }],
                    }))
                  }
                >
                  <Plus /> Add criterion
                </button>
                <button type="submit" className="primary-action">
                  <Check /> Create and assign
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
