import { useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  Check,
  ChevronDown,
  Download,
  Lock,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Unlock,
  Users,
} from 'lucide-react';

const students = [
  {
    id: 1,
    name: 'Maya Johnson',
    initials: 'MJ',
    algebra: 92,
    quiz: 88,
    project: 96,
    status: 'On track',
  },
  {
    id: 2,
    name: 'Daniel Mensah',
    initials: 'DM',
    algebra: 78,
    quiz: 72,
    project: 84,
    status: 'Needs attention',
  },
  {
    id: 3,
    name: 'Ava Williams',
    initials: 'AW',
    algebra: 98,
    quiz: 94,
    project: 91,
    status: 'On track',
  },
  {
    id: 4,
    name: 'Noah Chen',
    initials: 'NC',
    algebra: 85,
    quiz: 81,
    project: 88,
    status: 'On track',
  },
  {
    id: 5,
    name: 'Sofia Rivera',
    initials: 'SR',
    algebra: null,
    quiz: 76,
    project: 80,
    status: 'Missing work',
  },
];
const columns = [
  { key: 'algebra', label: 'Algebraic expressions', weight: '30%' },
  { key: 'quiz', label: 'Fractions checkpoint', weight: '25%' },
  { key: 'project', label: 'Unit project', weight: '45%' },
];
const score = (student) =>
  Math.round((student.algebra ?? 0) * 0.3 + student.quiz * 0.25 + student.project * 0.45);

export default function Gradebook() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [view, setView] = useState('Teacher view');
  const [grades, setGrades] = useState(students);
  const visible = useMemo(
    () => grades.filter((student) => student.name.toLowerCase().includes(query.toLowerCase())),
    [grades, query]
  );
  const average = Math.round(
    visible.reduce((sum, student) => sum + score(student), 0) / Math.max(visible.length, 1)
  );
  function updateGrade(id, key, value) {
    setGrades((items) =>
      items.map((student) =>
        student.id === id
          ? { ...student, [key]: value === '' ? null : Math.max(0, Math.min(100, Number(value))) }
          : student
      )
    );
  }
  return (
    <main className="gradebook-shell">
      <header className="gradebook-header">
        <div>
          <p className="eyebrow">Academic records</p>
          <h1>Gradebook</h1>
          <p>
            One trustworthy view of learning progress, calculated weights, exceptions, and final
            results.
          </p>
        </div>
        <div className="gradebook-actions">
          <button
            className="secondary-action"
            onClick={() => setView(view === 'Teacher view' ? 'Student view' : 'Teacher view')}
          >
            <Users /> {view}
          </button>
          <button className="secondary-action">
            <Download /> Export
          </button>
          <button
            className={locked ? 'secondary-action active' : 'secondary-action'}
            onClick={() => setLocked(!locked)}
          >
            {locked ? <Unlock /> : <Lock />} {locked ? 'Unlock' : 'Lock'} term
          </button>
        </div>
      </header>
      <nav className="gradebook-tabs">
        <button className="active">Term 1 · Algebra</button>
        <button>Categories</button>
        <button>Standards</button>
        <button>History</button>
      </nav>
      <section className="gradebook-metrics">
        <div>
          <BarChart3 />
          <span>
            <strong>{average}%</strong>
            <small>Class average</small>
          </span>
        </div>
        <div>
          <Check />
          <span>
            <strong>
              {visible.filter((s) => score(s) >= 70).length}/{visible.length}
            </strong>
            <small>On track</small>
          </span>
        </div>
        <div>
          <Archive />
          <span>
            <strong>{visible.filter((s) => s.algebra === null).length}</strong>
            <small>Missing work</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>{finalized ? 'Finalized' : 'Open'}</strong>
            <small>Gradebook state</small>
          </span>
        </div>
      </section>
      <div className="gradebook-toolbar">
        <label className="gradebook-search">
          <Search />
          <input
            aria-label="Search students"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students..."
          />
        </label>
        <button className="filter-chip active">
          All students <ChevronDown />
        </button>
        <span className="gradebook-sync">Last saved just now</span>
      </div>
      <section className="gradebook-table-wrap">
        <table className="gradebook-table">
          <thead>
            <tr>
              <th>Student</th>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.label}
                  <small>{column.weight}</small>
                </th>
              ))}
              <th>Term grade</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="grade-student">
                    <span>{student.initials}</span>
                    <strong>{student.name}</strong>
                    <small className={student.status === 'Needs attention' ? 'attention' : ''}>
                      {student.status}
                    </small>
                  </div>
                </td>
                {columns.map((column) => (
                  <td key={column.key}>
                    <input
                      disabled={locked || view === 'Student view'}
                      aria-label={`${student.name} ${column.label}`}
                      value={student[column.key] ?? ''}
                      placeholder="—"
                      onChange={(e) => updateGrade(student.id, column.key, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <strong className={score(student) < 70 ? 'grade-low' : 'grade-good'}>
                    {score(student)}%
                  </strong>
                </td>
                <td>
                  <button
                    className="table-action"
                    aria-label={`Open ${student.name}`}
                    onClick={() => setSelected(student)}
                  >
                    <MoreHorizontal />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="gradebook-footer">
        <div>
          <strong>
            {finalized
              ? 'Term grades are finalized.'
              : locked
                ? 'Term is locked for review.'
                : 'Changes save automatically.'}
          </strong>
          <span>Missing, late, excused, and exempt states remain visible in History.</span>
        </div>
        <button className="primary-action" disabled={locked} onClick={() => setFinalized(true)}>
          <Lock /> Finalize term
        </button>
      </section>
      {selected && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal grade-detail-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close grade details"
            >
              ×
            </button>
            <p className="eyebrow">Student record</p>
            <h2>{selected.name}</h2>
            <p className="modal-copy">Term 1 · Algebra · {selected.status}</p>
            <div className="grade-detail-grid">
              <strong>
                {score(selected)}%<small>Weighted grade</small>
              </strong>
              <strong>
                {selected.algebra ?? '—'}
                <small>Algebra</small>
              </strong>
              <strong>
                {selected.quiz}
                <small>Quiz</small>
              </strong>
              <strong>
                {selected.project}
                <small>Project</small>
              </strong>
            </div>
            <div className="security-card">
              <ShieldCheck />
              <div>
                <strong>Audit-safe override history</strong>
                <p>Grade changes, missing work, and finalization events are retained for review.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
