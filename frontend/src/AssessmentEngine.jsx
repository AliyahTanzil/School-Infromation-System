import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Clock3, FileQuestion, Plus, Save, Send } from 'lucide-react';
import api from './api/auth.js';
import './classroom.css';
import './digital-classroom.css';

const errorMessage = (error) =>
  error.response?.data?.error?.message || error.message || 'Request failed';
const emptyQuiz = { title: '', instructions: '', durationMinutes: 30, maxAttempts: 1 };
const emptyQuestion = {
  type: 'MULTIPLE_CHOICE',
  prompt: '',
  options: '',
  correctAnswer: '',
  points: 1,
};

export default function AssessmentEngine() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('sais.schoolId') || '');
  const [classroomId, setClassroomId] = useState(
    () => sessionStorage.getItem('sais.classroomId') || ''
  );
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quiz, setQuiz] = useState(emptyQuiz);
  const [question, setQuestion] = useState(emptyQuestion);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [notice, setNotice] = useState('');
  const headers = schoolId ? { 'x-school-id': schoolId } : {};

  const load = useCallback(async () => {
    if (!schoolId || !classroomId) return setQuizzes([]);
    try {
      const response = await api.get('/lms/quizzes', {
        headers: { 'x-school-id': schoolId },
        params: { classroomId },
      });
      setQuizzes(response.data.data);
      setNotice('');
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, [classroomId, schoolId]);

  useEffect(() => {
    sessionStorage.setItem('sais.schoolId', schoolId);
    sessionStorage.setItem('sais.classroomId', classroomId);
    load();
  }, [classroomId, load, schoolId]);

  async function openQuiz(id) {
    try {
      const response = await api.get(`/lms/quizzes/${id}`, { headers });
      setSelected(response.data.data);
      setAttempt(
        response.data.data.attempts?.find((item) => item.status === 'IN_PROGRESS') || null
      );
      setAnswers({});
      setNotice('');
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function createQuiz(event) {
    event.preventDefault();
    try {
      const response = await api.post(
        '/lms/quizzes',
        {
          ...quiz,
          classroomId,
          durationMinutes: Number(quiz.durationMinutes),
          maxAttempts: Number(quiz.maxAttempts),
        },
        { headers }
      );
      setQuiz(emptyQuiz);
      setNotice('Quiz draft created.');
      await load();
      await openQuiz(response.data.data.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function addQuestion(event) {
    event.preventDefault();
    const options =
      question.type === 'SHORT_ANSWER'
        ? []
        : question.options
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    try {
      await api.post(
        `/lms/quizzes/${selected.id}/questions`,
        { ...question, options, points: Number(question.points) },
        { headers }
      );
      setQuestion(emptyQuestion);
      await openQuiz(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function changeStatus(status) {
    try {
      await api.patch(`/lms/quizzes/${selected.id}/status`, { status }, { headers });
      await openQuiz(selected.id);
      await load();
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function startAttempt() {
    try {
      const response = await api.post(`/lms/quizzes/${selected.id}/attempts`, {}, { headers });
      setAttempt(response.data.data);
      setNotice('Timed attempt started.');
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function saveAnswer(questionId, response) {
    setAnswers((current) => ({ ...current, [questionId]: response }));
    if (!attempt) return;
    try {
      await api.put(
        `/lms/quizzes/attempts/${attempt.id}/answers`,
        { questionId, response },
        { headers }
      );
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function submitAttempt() {
    try {
      const response = await api.post(
        `/lms/quizzes/attempts/${attempt.id}/submit`,
        {},
        { headers }
      );
      setNotice(`Attempt submitted: ${response.data.data.score}/${response.data.data.maxScore}.`);
      await openQuiz(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  return (
    <main className="assessment-shell">
      <header className="assessment-header">
        <div>
          <p className="eyebrow">Online assessment engine</p>
          <h1>Classroom quizzes</h1>
          <p>
            Policy-linked authoring, controlled publication, timed attempts, autosave, and
            server-side scoring.
          </p>
        </div>
      </header>
      <section className="assessment-metrics">
        <label>
          School ID
          <input
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            placeholder="School UUID"
          />
        </label>
        <label>
          Classroom ID
          <input
            value={classroomId}
            onChange={(event) => setClassroomId(event.target.value)}
            placeholder="Classroom UUID"
          />
        </label>
        <div>
          <FileQuestion />
          <span>
            <strong>{quizzes.length}</strong>
            <small>accessible quizzes</small>
          </span>
        </div>
      </section>
      {notice && <div className="dc-notice">{notice}</div>}
      <div className="assessment-layout">
        <aside className="assessment-sidebar">
          <div className="sidebar-heading">
            <span>Quizzes</span>
            <button onClick={load} type="button">
              Refresh
            </button>
          </div>
          <div className="question-nav">
            {quizzes.map((item) => (
              <button key={item.id} onClick={() => openQuiz(item.id)} type="button">
                <strong>{item.title}</strong>
                <small>
                  {item.status} · {item._count.questions} questions
                </small>
              </button>
            ))}
          </div>
          <form className="create-form" onSubmit={createQuiz}>
            <input
              required
              value={quiz.title}
              onChange={(event) => setQuiz({ ...quiz, title: event.target.value })}
              placeholder="Quiz title"
            />
            <textarea
              value={quiz.instructions}
              onChange={(event) => setQuiz({ ...quiz, instructions: event.target.value })}
              placeholder="Instructions"
            />
            <input
              min="1"
              max="240"
              type="number"
              value={quiz.durationMinutes}
              onChange={(event) => setQuiz({ ...quiz, durationMinutes: event.target.value })}
            />
            <input
              min="1"
              max="10"
              type="number"
              value={quiz.maxAttempts}
              onChange={(event) => setQuiz({ ...quiz, maxAttempts: event.target.value })}
            />
            <button className="primary-action" disabled={!classroomId} type="submit">
              <Plus /> Create draft
            </button>
          </form>
        </aside>
        {selected ? (
          <section className="assessment-card">
            <div className="assessment-card-top">
              <span className="item-type">{selected.status}</span>
              <span className="points-label">
                <Clock3 /> {selected.durationMinutes} minutes
              </span>
            </div>
            <h2>{selected.title}</h2>
            <p>{selected.instructions}</p>
            {selected.status === 'DRAFT' && (
              <form className="create-form" onSubmit={addQuestion}>
                <select
                  value={question.type}
                  onChange={(event) => setQuestion({ ...question, type: event.target.value })}
                >
                  <option>MULTIPLE_CHOICE</option>
                  <option>TRUE_FALSE</option>
                  <option>SHORT_ANSWER</option>
                </select>
                <textarea
                  required
                  value={question.prompt}
                  onChange={(event) => setQuestion({ ...question, prompt: event.target.value })}
                  placeholder="Question prompt"
                />
                {question.type !== 'SHORT_ANSWER' && (
                  <input
                    required
                    value={question.options}
                    onChange={(event) => setQuestion({ ...question, options: event.target.value })}
                    placeholder="Comma-separated options"
                  />
                )}
                <input
                  required
                  value={question.correctAnswer}
                  onChange={(event) =>
                    setQuestion({ ...question, correctAnswer: event.target.value })
                  }
                  placeholder="Correct answer"
                />
                <input
                  min="1"
                  max="100"
                  type="number"
                  value={question.points}
                  onChange={(event) => setQuestion({ ...question, points: event.target.value })}
                />
                <button className="secondary-action" type="submit">
                  <Save /> Add question
                </button>
              </form>
            )}
            <div className="answer-area">
              {selected.questions.map((item, index) => (
                <article key={item.id}>
                  <strong>
                    {index + 1}. {item.prompt}
                  </strong>
                  {attempt && item.options?.length ? (
                    item.options.map((option) => (
                      <label className="answer-option" key={option}>
                        <input
                          checked={answers[item.id] === option}
                          name={item.id}
                          onChange={() => saveAnswer(item.id, option)}
                          type="radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  ) : attempt ? (
                    <input
                      className="short-answer"
                      value={answers[item.id] || ''}
                      onChange={(event) => saveAnswer(item.id, event.target.value)}
                    />
                  ) : (
                    <small>{item.points} points</small>
                  )}
                </article>
              ))}
            </div>
            <div className="assessment-card-footer">
              <span>{selected.attempts.length} attempts</span>
              <div>
                {selected.status === 'DRAFT' && (
                  <button
                    className="primary-action"
                    onClick={() => changeStatus('PUBLISHED')}
                    type="button"
                  >
                    Publish <ArrowRight />
                  </button>
                )}
                {selected.status === 'PUBLISHED' && !attempt && (
                  <button className="primary-action" onClick={startAttempt} type="button">
                    Start attempt
                  </button>
                )}
                {attempt?.status === 'IN_PROGRESS' && (
                  <button className="primary-action" onClick={submitAttempt} type="button">
                    Submit <Send />
                  </button>
                )}
                {selected.status === 'PUBLISHED' && (
                  <button
                    className="secondary-action"
                    onClick={() => changeStatus('CLOSED')}
                    type="button"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="assessment-card">
            <h2>Select or create a quiz</h2>
          </section>
        )}
      </div>
    </main>
  );
}
