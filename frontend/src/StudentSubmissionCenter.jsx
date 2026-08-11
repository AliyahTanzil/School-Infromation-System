import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileText, RotateCcw, Send, Search } from 'lucide-react';
import './classroom.css';

const INITIAL_WORK = [
  {
    id: 1,
    title: 'Algebraic expressions',
    course: 'Mathematics 8A',
    due: 'Today, 3:30 PM',
    points: 20,
    status: 'In progress',
    feedback: '',
  },
  {
    id: 2,
    title: 'Fractions checkpoint',
    course: 'Mathematics 8A',
    due: 'Fri, 11:30 AM',
    points: 15,
    status: 'Assigned',
    feedback: '',
  },
  {
    id: 3,
    title: 'Science lab reflection',
    course: 'Integrated Science',
    due: 'Yesterday',
    points: 25,
    status: 'Returned',
    grade: '22 / 25',
    feedback: 'Strong observation notes. Add one more connection to the hypothesis.',
  },
  {
    id: 4,
    title: 'Reading response',
    course: 'English Language Arts',
    due: 'Aug 08',
    points: 10,
    status: 'Missing',
    feedback: '',
  },
];
const FILTERS = ['All work', 'Assigned', 'In progress', 'Submitted', 'Returned', 'Missing'];

export default function StudentSubmissionCenter() {
  const [work, setWork] = useState(INITIAL_WORK);
  const [filter, setFilter] = useState('All work');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [saveState, setSaveState] = useState('Not started');

  const visible = useMemo(
    () =>
      work.filter(
        (item) =>
          (filter === 'All work' || item.status === filter) &&
          `${item.title} ${item.course}`.toLowerCase().includes(query.toLowerCase())
      ),
    [work, filter, query]
  );
  const counts = FILTERS.reduce(
    (result, key) => ({
      ...result,
      [key]: key === 'All work' ? work.length : work.filter((item) => item.status === key).length,
    }),
    {}
  );

  function openWork(item) {
    setSelected(item);
    setResponse(item.response || '');
    setSaveState(item.status === 'In progress' ? 'Draft saved' : 'Not started');
  }
  function saveDraft(event) {
    event.preventDefault();
    setWork((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, response, status: 'In progress' } : item
      )
    );
    setSelected({ ...selected, response, status: 'In progress' });
    setSaveState('Draft saved just now');
  }
  function submitWork() {
    if (!response.trim()) return setSaveState('Write a response before submitting.');
    setWork((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, response, status: 'Submitted' } : item
      )
    );
    setSelected({ ...selected, response, status: 'Submitted' });
    setSaveState('Submitted for review');
  }
  function retractWork() {
    setWork((items) =>
      items.map((item) => (item.id === selected.id ? { ...item, status: 'In progress' } : item))
    );
    setSelected({ ...selected, status: 'In progress' });
    setSaveState('Submission retracted');
  }

  return (
    <main className="submission-center-shell">
      <header className="submission-center-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>My work</h1>
          <p>Keep track of what is assigned, submitted, and ready for your next step.</p>
        </div>
        <div className="work-summary">
          <span>
            <strong>{counts['In progress']}</strong> in progress
          </span>
          <span>
            <strong>{counts.Returned}</strong> returned
          </span>
        </div>
      </header>
      <div className="work-toolbar">
        <label className="materials-search">
          <Search />
          <input
            aria-label="Search my work"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assignments..."
          />
        </label>
        <div className="folder-pills">
          {FILTERS.map((item) => (
            <button
              key={item}
              className={filter === item ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setFilter(item)}
            >
              {item}
              <span>{counts[item]}</span>
            </button>
          ))}
        </div>
      </div>
      <section className="work-layout">
        <div className="work-list">
          {visible.map((item) => (
            <button className="work-card" key={item.id} onClick={() => openWork(item)}>
              <span className="classwork-icon">
                <FileText />
              </span>
              <span className="work-card-body">
                <span className="item-type">{item.course}</span>
                <strong>{item.title}</strong>
                <small>
                  <Clock3 /> Due {item.due} · {item.points} points
                </small>
              </span>
              <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                {item.status}
              </span>
              <ArrowRight />
            </button>
          ))}
        </div>
        <aside className="work-upcoming">
          <p className="eyebrow">Next up</p>
          <h2>Make progress visible.</h2>
          <p>
            Open an assignment to save a draft, submit work, or review feedback from your teacher.
          </p>
          <div className="upcoming-note">
            <CheckCircle2 />
            <span>
              <strong>{counts.Submitted} submitted</strong>
              <small>Teacher review is next.</small>
            </span>
          </div>
        </aside>
      </section>
      {selected && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal work-detail-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close assignment detail"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <p className="eyebrow">{selected.course}</p>
            <h2>{selected.title}</h2>
            <p className="modal-copy">
              Due {selected.due} · {selected.points} points · <strong>{selected.status}</strong>
            </p>
            {selected.feedback && (
              <div className="student-response">
                <span>Teacher feedback {selected.grade && `· ${selected.grade}`}</span>
                <p>{selected.feedback}</p>
              </div>
            )}
            {selected.status === 'Returned' ? (
              <button
                className="primary-action"
                onClick={() => {
                  setResponse('');
                  setSelected({ ...selected, status: 'In progress' });
                }}
              >
                Resubmit revision <RotateCcw />
              </button>
            ) : (
              <form className="student-submit-form" onSubmit={saveDraft}>
                <textarea
                  aria-label="Assignment response"
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  placeholder="Write your response here..."
                  disabled={selected.status === 'Submitted'}
                />
                <div className="student-submit-actions">
                  <span>{saveState}</span>
                  {selected.status === 'Submitted' ? (
                    <button className="secondary-action" type="button" onClick={retractWork}>
                      Retract submission
                    </button>
                  ) : (
                    <>
                      <button className="secondary-action" type="submit">
                        Save draft
                      </button>
                      <button className="primary-action" type="button" onClick={submitWork}>
                        Submit work <Send />
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
