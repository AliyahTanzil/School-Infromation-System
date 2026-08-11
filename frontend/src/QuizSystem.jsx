import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Flag,
  History,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const seedQuestions = [
  {
    id: 1,
    type: 'Multiple choice',
    prompt: 'Which expression is equivalent to 3(x + 2)?',
    options: ['3x + 2', '3x + 6', 'x + 6', '3x + 5'],
    answer: 1,
    points: 2,
    standard: 'A.REI.1',
  },
  {
    id: 2,
    type: 'True / false',
    prompt: 'The distributive property can be used to expand a product.',
    options: ['True', 'False'],
    answer: 0,
    points: 1,
    standard: 'A.REI.1',
  },
  {
    id: 3,
    type: 'Short answer',
    prompt: 'Explain how you would check that 4x + 7 is correct when x = 2.',
    options: [],
    answer: null,
    points: 3,
    standard: 'MP.3',
  },
];
const seedAttempts = [
  {
    id: 1,
    name: 'Maya Johnson',
    status: 'Submitted',
    score: 5,
    total: 6,
    started: 'Today, 9:04 AM',
    submitted: 'Today, 9:26 AM',
    flags: 0,
  },
  {
    id: 2,
    name: 'Daniel Mensah',
    status: 'In progress',
    score: null,
    total: 6,
    started: 'Today, 9:13 AM',
    submitted: null,
    flags: 1,
  },
  {
    id: 3,
    name: 'Ava Williams',
    status: 'Returned',
    score: 6,
    total: 6,
    started: 'Yesterday, 2:10 PM',
    submitted: 'Yesterday, 2:29 PM',
    flags: 0,
  },
];

export default function QuizSystem() {
  const [mode, setMode] = useState('teacher');
  const [tab, setTab] = useState('Overview');
  const [lifecycle, setLifecycle] = useState('Draft');
  const [questions, setQuestions] = useState(seedQuestions);
  const [attempts, setAttempts] = useState(seedAttempts);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [answers, setAnswers] = useState({ 0: 1, 1: 0, 2: '' });
  const [flagged, setFlagged] = useState({});
  const [saved, setSaved] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    type: 'Multiple choice',
    prompt: '',
    points: 2,
  });
  const [toast, setToast] = useState('');

  const answeredCount = Object.values(answers).filter((value) => value !== '').length;
  const completion = Math.round((answeredCount / questions.length) * 100);
  const average = useMemo(() => {
    const scored = attempts.filter((attempt) => attempt.score !== null);
    return scored.length
      ? Math.round(
          (scored.reduce((sum, attempt) => sum + attempt.score, 0) /
            scored.reduce((sum, attempt) => sum + attempt.total, 0)) *
            100
        )
      : 0;
  }, [attempts]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }
  function addQuestion(event) {
    event.preventDefault();
    if (!newQuestion.prompt.trim()) return;
    setQuestions((items) => [
      ...items,
      {
        id: Date.now(),
        ...newQuestion,
        prompt: newQuestion.prompt.trim(),
        options:
          newQuestion.type === 'Multiple choice'
            ? ['Option A', 'Option B', 'Option C', 'Option D']
            : newQuestion.type === 'True / false'
              ? ['True', 'False']
              : [],
        answer: 0,
        points: Number(newQuestion.points) || 1,
        standard: 'A.REI.1',
      },
    ]);
    setNewQuestion({ type: 'Multiple choice', prompt: '', points: 2 });
    setShowCreate(false);
    notify('Question added to the bank.');
  }
  function saveAnswer(value) {
    setAnswers((items) => ({ ...items, [selectedQuestion]: value }));
    setSaved(false);
    window.setTimeout(() => setSaved(true), 450);
  }
  function submitAttempt() {
    setAttempts((items) => [
      {
        id: Date.now(),
        name: 'You',
        status: 'Submitted',
        score: null,
        total: questions.reduce((sum, question) => sum + question.points, 0),
        started: 'Just now',
        submitted: 'Just now',
        flags: Object.values(flagged).filter(Boolean).length,
      },
      ...items,
    ]);
    notify('Attempt submitted for grading.');
  }
  function changeLifecycle(next) {
    setLifecycle(next);
    notify(`Quiz moved to ${next.toLowerCase()}.`);
  }

  return (
    <main className="quiz-shell">
      <header className="quiz-header">
        <div>
          <button className="back-link" onClick={() => window.history.back()}>
            <ArrowLeft /> Classroom
          </button>
          <p className="eyebrow">Online assessment engine</p>
          <h1>Unit 1 · Expressions & equations</h1>
          <p>
            Reusable quiz authoring, secure attempts, grading, analytics, and classroom release
            controls in one workspace.
          </p>
        </div>
        <div className="quiz-header-actions">
          <button
            className="mode-toggle"
            onClick={() => setMode(mode === 'teacher' ? 'student' : 'teacher')}
          >
            {mode === 'teacher' ? <Users /> : <ShieldCheck />}{' '}
            {mode === 'teacher' ? 'Student preview' : 'Teacher view'}
          </button>
          <span className={`quiz-status ${lifecycle.toLowerCase()}`}>
            <span />
            {lifecycle}
          </span>
        </div>
      </header>
      <nav className="quiz-tabs" aria-label="Quiz sections">
        {['Overview', 'Question bank', 'Attempts', 'Analytics', 'Audit log'].map((item) => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>
      {mode === 'student' ? (
        <section className="quiz-student-view">
          <div className="student-attempt-banner">
            <div>
              <p className="eyebrow">Student attempt</p>
              <h2>Show what you know.</h2>
              <p>20 minutes · 3 questions · 6 points · one attempt remaining</p>
            </div>
            <div className="timer-card">
              <Clock3 />
              <strong>18:42</strong>
              <span>remaining</span>
            </div>
          </div>
          <div className="attempt-layout">
            <aside className="attempt-sidebar">
              <strong>Questions</strong>
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  className={`${selectedQuestion === index ? 'active ' : ''}${answers[index] !== '' ? 'answered' : ''}`}
                  onClick={() => setSelectedQuestion(index)}
                >
                  <span>{index + 1}</span>
                  <small>{answers[index] !== '' ? 'Answered' : 'Not answered'}</small>
                  {flagged[index] && <Flag />}
                </button>
              ))}
              <div className="autosave">
                <Save />
                {saved ? 'Saved automatically' : 'Saving...'}
              </div>
            </aside>
            <article className="attempt-card">
              <div className="attempt-card-top">
                <span>
                  Question {selectedQuestion + 1} of {questions.length}
                </span>
                <button
                  className={flagged[selectedQuestion] ? 'flag active' : 'flag'}
                  onClick={() =>
                    setFlagged((items) => ({
                      ...items,
                      [selectedQuestion]: !items[selectedQuestion],
                    }))
                  }
                >
                  <Flag /> {flagged[selectedQuestion] ? 'Flagged' : 'Flag for review'}
                </button>
              </div>
              <p className="question-type">
                {questions[selectedQuestion].type} · {questions[selectedQuestion].points} points
              </p>
              <h2>{questions[selectedQuestion].prompt}</h2>
              {questions[selectedQuestion].options.length ? (
                <div className="answer-options">
                  {questions[selectedQuestion].options.map((option, index) => (
                    <label
                      className={
                        answers[selectedQuestion] === index
                          ? 'answer-choice selected'
                          : 'answer-choice'
                      }
                      key={option}
                    >
                      <input
                        type="radio"
                        name={`question-${selectedQuestion}`}
                        checked={answers[selectedQuestion] === index}
                        onChange={() => saveAnswer(index)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="quiz-answer-text"
                  value={answers[selectedQuestion]}
                  onChange={(event) => saveAnswer(event.target.value)}
                  placeholder="Write a concise explanation..."
                />
              )}
              <div className="attempt-footer">
                <span>{completion}% complete</span>
                <div>
                  <button
                    className="secondary-action"
                    disabled={selectedQuestion === 0}
                    onClick={() => setSelectedQuestion((index) => index - 1)}
                  >
                    Previous
                  </button>
                  {selectedQuestion < questions.length - 1 ? (
                    <button
                      className="primary-action"
                      onClick={() => setSelectedQuestion((index) => index + 1)}
                    >
                      Next <ArrowLeft className="flip-icon" />
                    </button>
                  ) : (
                    <button className="primary-action" onClick={submitAttempt}>
                      <Send /> Submit attempt
                    </button>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <>
          <section className="quiz-metrics">
            <div>
              <BarChart3 />
              <span>
                <strong>{attempts.length}</strong>
                <small>attempts started</small>
              </span>
            </div>
            <div>
              <CheckCircle2 />
              <span>
                <strong>
                  {
                    attempts.filter(
                      (item) => item.status === 'Submitted' || item.status === 'Returned'
                    ).length
                  }
                </strong>
                <small>submitted</small>
              </span>
            </div>
            <div>
              <Sparkles />
              <span>
                <strong>{average}%</strong>
                <small>average score</small>
              </span>
            </div>
            <div>
              <CalendarDays />
              <span>
                <strong>Fri, 3:30 PM</strong>
                <small>due date</small>
              </span>
            </div>
          </section>
          <section className="quiz-body">
            <div className="quiz-main">
              {tab === 'Overview' && (
                <>
                  <div className="quiz-overview-card">
                    <div>
                      <p className="eyebrow">Configuration</p>
                      <h2>Ready for a focused check-in.</h2>
                      <p>
                        Students get one timed attempt with autosave, review flags, automatic
                        objective grading, and manual review for written responses.
                      </p>
                    </div>
                    <div className="config-grid">
                      <span>
                        <Clock3 />
                        <b>20 min</b>
                        <small>time limit</small>
                      </span>
                      <span>
                        <RotateCcw />
                        <b>1</b>
                        <small>attempt limit</small>
                      </span>
                      <span>
                        <Lock />
                        <b>Secure</b>
                        <small>access policy</small>
                      </span>
                      <span>
                        <Eye />
                        <b>After return</b>
                        <small>results release</small>
                      </span>
                    </div>
                  </div>
                  <div className="integration-grid">
                    <article>
                      <CalendarDays />
                      <div>
                        <strong>Calendar</strong>
                        <p>Due date and scheduled release are synced to the classroom calendar.</p>
                      </div>
                      <Check />
                    </article>
                    <article>
                      <BarChart3 />
                      <div>
                        <strong>Gradebook</strong>
                        <p>Returned scores map to the Expressions & equations category.</p>
                      </div>
                      <Check />
                    </article>
                    <article>
                      <Send />
                      <div>
                        <strong>Notifications</strong>
                        <p>Students receive publish, due, return, and resubmission alerts.</p>
                      </div>
                      <Check />
                    </article>
                  </div>
                </>
              )}
              {tab === 'Question bank' && (
                <div className="quiz-panel">
                  <div className="panel-title">
                    <div>
                      <p className="eyebrow">Question bank</p>
                      <h2>
                        {questions.length} questions ·{' '}
                        {questions.reduce((sum, question) => sum + question.points, 0)} points
                      </h2>
                    </div>
                    <button className="primary-action" onClick={() => setShowCreate(true)}>
                      <Plus /> Add question
                    </button>
                  </div>
                  {questions.map((question, index) => (
                    <article className="bank-question" key={question.id}>
                      <span className="question-number">{index + 1}</span>
                      <div>
                        <span>
                          {question.type} · {question.points} points · {question.standard}
                        </span>
                        <strong>{question.prompt}</strong>
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => notify('Question preview opened.')}
                      >
                        <Eye />
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {tab === 'Attempts' && (
                <div className="quiz-panel">
                  <div className="panel-title">
                    <div>
                      <p className="eyebrow">Attempt review</p>
                      <h2>{attempts.length} learner attempts</h2>
                    </div>
                    <button
                      className="secondary-action"
                      onClick={() => notify('Gradebook export prepared.')}
                    >
                      <FilePlus2 /> Export gradebook
                    </button>
                  </div>
                  {attempts.map((attempt) => (
                    <article className="attempt-row" key={attempt.id}>
                      <span className="student-avatar">
                        {attempt.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </span>
                      <div>
                        <strong>{attempt.name}</strong>
                        <small>
                          {attempt.started}
                          {attempt.submitted
                            ? ` · submitted ${attempt.submitted}`
                            : ' · active attempt'}
                        </small>
                      </div>
                      <span
                        className={`attempt-status ${attempt.status.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        {attempt.status}
                      </span>
                      <strong className="attempt-score">
                        {attempt.score === null ? '—' : `${attempt.score}/${attempt.total}`}
                      </strong>
                      <button className="secondary-action" onClick={() => setShowReview(attempt)}>
                        Review
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {tab === 'Analytics' && (
                <div className="analytics-grid">
                  <article className="quiz-panel">
                    <p className="eyebrow">Cohort performance</p>
                    <h2>Strong on expansion, review substitution.</h2>
                    <div className="bar-chart">
                      {[68, 84, 76, 92, 61, 79].map((height, index) => (
                        <span key={index} style={{ height: `${height}%` }}>
                          <small>{['Q1', 'Q2', 'Q3', 'A.REI', 'MP.3', 'Overall'][index]}</small>
                        </span>
                      ))}
                    </div>
                  </article>
                  <article className="quiz-panel diagnostics">
                    <p className="eyebrow">Question diagnostics</p>
                    {questions.map((question, index) => (
                      <div key={question.id}>
                        <span>Q{index + 1}</span>
                        <strong>{index === 1 ? '92%' : index === 0 ? '84%' : '61%'}</strong>
                        <small>
                          {question.standard} · {index === 2 ? 'needs reteach' : 'on track'}
                        </small>
                      </div>
                    ))}
                  </article>
                </div>
              )}
              {tab === 'Audit log' && (
                <div className="quiz-panel audit-panel">
                  <p className="eyebrow">Security and accountability</p>
                  <h2>Every high-impact action is traceable.</h2>
                  {[
                    'Quiz created by Ms. Sarah Adams · 09:10 AM',
                    'Question 3 updated · written response enabled · 09:18 AM',
                    'Preview opened by teacher · 09:22 AM',
                    'Results release policy set to after return · 09:25 AM',
                  ].map((event) => (
                    <div key={event}>
                      <History />
                      <span>{event}</span>
                      <small>Recorded</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <aside className="quiz-side">
              <div className="lifecycle-card">
                <p className="eyebrow">Lifecycle</p>
                <h3>Control release safely.</h3>
                {['Draft', 'Scheduled', 'Published', 'Closed'].map((state) => (
                  <button
                    key={state}
                    className={lifecycle === state ? 'active' : ''}
                    onClick={() => changeLifecycle(state)}
                  >
                    <span>{lifecycle === state ? <CheckCircle2 /> : <span />}</span>
                    {state}
                  </button>
                ))}
                <button
                  className="primary-action"
                  onClick={() =>
                    changeLifecycle(lifecycle === 'Published' ? 'Closed' : 'Published')
                  }
                >
                  {lifecycle === 'Published' ? <Lock /> : <Send />}
                  {lifecycle === 'Published' ? 'Close quiz' : 'Publish quiz'}
                </button>
              </div>
              <div className="security-card">
                <ShieldCheck />
                <div>
                  <strong>Protected attempt policy</strong>
                  <p>
                    Eligibility, attempt limits, autosave, and result release are enforced before
                    submission.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </>
      )}
      {showCreate && (
        <div className="modal-backdrop">
          <section className="create-modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setShowCreate(false)}>
              <X />
            </button>
            <p className="eyebrow">Question bank</p>
            <h2>Add a question.</h2>
            <form className="create-form" onSubmit={addQuestion}>
              <label>
                Question type
                <select
                  value={newQuestion.type}
                  onChange={(event) => setNewQuestion({ ...newQuestion, type: event.target.value })}
                >
                  <option>Multiple choice</option>
                  <option>True / false</option>
                  <option>Short answer</option>
                </select>
              </label>
              <label>
                Prompt
                <textarea
                  required
                  value={newQuestion.prompt}
                  onChange={(event) =>
                    setNewQuestion({ ...newQuestion, prompt: event.target.value })
                  }
                  placeholder="Write the question prompt..."
                />
              </label>
              <label>
                Points
                <input
                  type="number"
                  min="1"
                  value={newQuestion.points}
                  onChange={(event) =>
                    setNewQuestion({ ...newQuestion, points: event.target.value })
                  }
                />
              </label>
              <button className="primary-action" type="submit">
                Add to question bank <Plus />
              </button>
            </form>
          </section>
        </div>
      )}
      {showReview && (
        <div className="modal-backdrop">
          <section className="create-modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setShowReview(null)}>
              <X />
            </button>
            <p className="eyebrow">Attempt review</p>
            <h2>{showReview.name}</h2>
            <p className="modal-copy">
              {showReview.status} · {showReview.submitted || 'Active now'}
            </p>
            <div className="review-summary">
              <strong>
                {showReview.score === null ? 'Pending' : `${showReview.score}/${showReview.total}`}
              </strong>
              <span>Objective score</span>
            </div>
            <textarea className="quiz-answer-text" placeholder="Add feedback for the learner..." />
            <div className="review-actions">
              <button
                className="secondary-action"
                onClick={() => {
                  setAttempts((items) =>
                    items.map((item) =>
                      item.id === showReview.id ? { ...item, status: 'Needs revision' } : item
                    )
                  );
                  setShowReview(null);
                  notify('Returned for revision.');
                }}
              >
                Return for revision
              </button>
              <button
                className="primary-action"
                onClick={() => {
                  setAttempts((items) =>
                    items.map((item) =>
                      item.id === showReview.id ? { ...item, status: 'Returned' } : item
                    )
                  );
                  setShowReview(null);
                  notify('Results returned to learner.');
                }}
              >
                Return results <CheckCircle2 />
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="quiz-toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
