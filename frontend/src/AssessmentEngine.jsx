import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Flag,
  Save,
  TimerReset,
} from 'lucide-react';
import './classroom.css';

const questions = [
  {
    id: 1,
    type: 'Multiple choice',
    prompt: 'Which expression is equivalent to 3(x + 2)?',
    options: ['3x + 2', '3x + 6', 'x + 6', '3x - 6'],
    answer: 1,
  },
  { id: 2, type: 'Short answer', prompt: 'Solve for x: 2x + 8 = 18', answerText: '5' },
  {
    id: 3,
    type: 'True or false',
    prompt: 'The distributive property can be used to expand an expression.',
    options: ['True', 'False'],
    answer: 0,
  },
];

const lifecycle = ['Draft', 'Scheduled', 'Published', 'Closed'];

export default function AssessmentEngine() {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('Published');
  const [savedAt, setSavedAt] = useState('Not saved yet');
  const [showResults, setShowResults] = useState(false);
  const [timeLeft] = useState('28:42');
  const question = questions[activeQuestion];
  const answered = Object.keys(answers).length;
  const score = useMemo(
    () =>
      questions.reduce(
        (total, item) => total + (answers[item.id] === (item.answer ?? item.answerText) ? 1 : 0),
        0
      ),
    [answers]
  );

  function saveAttempt() {
    setSavedAt('Saved just now');
  }

  function submitAttempt(event) {
    event.preventDefault();
    saveAttempt();
    setShowResults(true);
  }

  return (
    <main className="assessment-shell">
      <header className="assessment-header">
        <div>
          <p className="eyebrow">Module 51.7 · Online assessment engine</p>
          <h1>Algebra readiness check</h1>
          <p>
            Timed assessment with autosave, question navigation, attempt limits, and controlled
            result release.
          </p>
        </div>
        <div className="assessment-header-actions">
          <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
          <button className="secondary-action" onClick={saveAttempt}>
            <Save /> {savedAt}
          </button>
        </div>
      </header>
      <section className="assessment-metrics">
        <div>
          <Clock3 />
          <span>
            <strong>{timeLeft}</strong>
            <small>remaining</small>
          </span>
        </div>
        <div>
          <FileQuestion />
          <span>
            <strong>
              {answered}/{questions.length}
            </strong>
            <small>answered</small>
          </span>
        </div>
        <div>
          <TimerReset />
          <span>
            <strong>1 of 2</strong>
            <small>attempt used</small>
          </span>
        </div>
        <div>
          <Flag />
          <span>
            <strong>20 points</strong>
            <small>total</small>
          </span>
        </div>
      </section>
      <div className="assessment-layout">
        <aside className="assessment-sidebar">
          <div className="sidebar-heading">
            <span>Questions</span>
            <small>Autosaved</small>
          </div>
          <div className="question-nav">
            {questions.map((item, index) => (
              <button
                key={item.id}
                className={`${activeQuestion === index ? 'active ' : ''}${answers[item.id] !== undefined ? 'answered' : ''}`}
                onClick={() => setActiveQuestion(index)}
              >
                <span>{index + 1}</span>
                <strong>{item.type}</strong>
                <small>{answers[item.id] !== undefined ? 'Answered' : 'Not started'}</small>
              </button>
            ))}
          </div>
          <div className="assessment-policy">
            <p className="eyebrow">Assessment policy</p>
            <span>Results release after teacher review.</span>
            <span>Responses save automatically.</span>
          </div>
        </aside>
        <form className="assessment-card" onSubmit={submitAttempt}>
          <div className="assessment-card-top">
            <span className="item-type">
              Question {activeQuestion + 1} of {questions.length}
            </span>
            <span className="points-label">{question.type} · 5 points</span>
          </div>
          <h2>{question.prompt}</h2>
          <div className="answer-area">
            {question.options ? (
              question.options.map((option, index) => (
                <label
                  className={
                    answers[question.id] === index ? 'answer-option selected' : 'answer-option'
                  }
                  key={option}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === index}
                    onChange={() => setAnswers({ ...answers, [question.id]: index })}
                  />{' '}
                  <span>{option}</span>
                </label>
              ))
            ) : (
              <input
                className="short-answer"
                value={answers[question.id] || ''}
                onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                placeholder="Type your answer"
              />
            )}
          </div>
          <div className="assessment-card-footer">
            <span>
              <CheckCircle2 /> {savedAt}
            </span>
            <div>
              <button
                type="button"
                className="secondary-action"
                disabled={activeQuestion === 0}
                onClick={() => setActiveQuestion((index) => index - 1)}
              >
                Previous
              </button>
              {activeQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => setActiveQuestion((index) => index + 1)}
                >
                  Next <ArrowRight />
                </button>
              ) : (
                <button className="primary-action" type="submit">
                  Submit attempt <ArrowRight />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      {showResults && (
        <section className="assessment-results">
          <p className="eyebrow">Attempt submitted</p>
          <h2>Your responses are with the teacher.</h2>
          <p>
            {score} of {questions.length} answers match the answer key so far. The final grade
            remains hidden until review is complete.
          </p>
          <button className="secondary-action" onClick={() => setShowResults(false)}>
            Return to assessment
          </button>
        </section>
      )}
      <section className="assessment-lifecycle">
        <div>
          <p className="eyebrow">Teacher controls</p>
          <h2>Assessment lifecycle</h2>
        </div>
        <div className="lifecycle-track">
          {lifecycle.map((item) => (
            <button
              key={item}
              className={status === item ? 'active' : ''}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
