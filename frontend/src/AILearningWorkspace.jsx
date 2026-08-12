import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';

const modes = {
  teacher: {
    label: 'Teacher AI',
    title: 'Build better lessons, faster.',
    description:
      'Generate reviewable drafts for classroom work without publishing or grading automatically.',
    tools: ['Create assignment', 'Generate quiz', 'Lesson plan', 'Suggest feedback'],
  },
  student: {
    label: 'Student AI',
    title: 'Practice with a patient coach.',
    description:
      'Ask for explanations, hints, and revision plans while keeping the learner in control of the work.',
    tools: ['Explain a concept', 'Practice questions', 'Revision plan', 'Mistake explanation'],
  },
  admin: {
    label: 'Admin AI',
    title: 'Find the signal in school data.',
    description:
      'Summarize approved academic trends without exposing individual records beyond your role.',
    tools: ['Summarize trends', 'Curriculum insight', 'Report summary', 'Intervention review'],
  },
};

const prompts = {
  teacher: 'Create a reviewable assignment draft on quadratic equations for JSS 2.',
  student: 'Explain Newton’s third law with a simple example and one practice question.',
  admin: 'Summarize the attendance and completion signals that need a school-team review.',
};

export default function AILearningWorkspace() {
  const [mode, setMode] = useState('teacher');
  const [input, setInput] = useState(prompts.teacher);
  const [response, setResponse] = useState(null);
  const [modal, setModal] = useState(null);
  const current = modes[mode];

  const evidence = useMemo(
    () =>
      ({
        teacher: [
          'JSS 2 Mathematics',
          'Curriculum scope · Term 2',
          'Draft only · teacher review required',
        ],
        student: [
          'JSS 2 Mathematics',
          'Assigned materials · Term 2',
          'Practice mode · no submission changes',
        ],
        admin: [
          'School learning trends',
          'Aggregated signals · Term 2',
          'Tenant scope · role authorization enforced',
        ],
      })[mode],
    [mode]
  );

  function changeMode(next) {
    setMode(next);
    setInput(prompts[next]);
    setResponse(null);
  }

  function ask() {
    if (!input.trim()) return;
    if (/ignore previous|reveal.*prompt|private|password|sql|grade this/i.test(input)) {
      setResponse({
        refused: true,
        text: 'I can’t bypass safety controls, expose private records, or make an assessed decision. Try a teaching, practice, or approved summary request instead.',
      });
      return;
    }
    const copy =
      mode === 'teacher'
        ? 'Draft created with learning objectives, differentiated prompts, and a quality checklist. Review and edit every item before publishing.'
        : mode === 'student'
          ? 'Start with the core idea, try the worked example, then answer one practice question. I can offer a hint without completing assessed work.'
          : 'The strongest verified signal is completion consistency: review the subject cohort trend first, then ask the academic team to validate any intervention.';
    setResponse({ refused: false, text: copy });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 md:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
              SAIS AI learning layer
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Useful intelligence. Human judgment.
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              A role-aware educational assistant for teaching, learning, and approved school-level
              insight. Every generated result stays reviewable.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            <LockKeyhole size={15} /> Protected tenant context
          </div>
        </header>

        <nav
          className="flex flex-wrap gap-2 border-b border-slate-800 pb-4"
          aria-label="AI audience"
        >
          {Object.entries(modes).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeMode(key)}
              className={`rounded-full px-4 py-2 text-sm transition ${mode === key ? 'bg-indigo-300 text-slate-950' : 'border border-slate-700 text-slate-400 hover:border-indigo-300/60'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-indigo-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-200">
                  <Sparkles size={18} />
                  <span className="text-sm font-medium">{current.label}</span>
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">{current.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {current.description}
                </p>
              </div>
              <ShieldCheck className="hidden text-emerald-300 md:block" size={24} />
            </div>
            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-32 w-full resize-none bg-transparent text-lg leading-8 text-slate-100 outline-none"
                aria-label="AI learning request"
              />
              <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-500">
                  AI does not publish, grade, diagnose, or replace teacher judgment.
                </span>
                <button
                  type="button"
                  onClick={ask}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-200"
                >
                  <Send size={16} /> Run safely
                </button>
              </div>
            </div>
            {response && (
              <div
                className={`mt-4 rounded-2xl border p-5 ${response.refused ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}
              >
                <div className="flex items-start gap-3">
                  {response.refused ? <X size={18} /> : <CheckCircle2 size={18} />}
                  <p className="text-sm leading-6">{response.text}</p>
                </div>
                {!response.refused && (
                  <button
                    type="button"
                    onClick={() => setModal('review')}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200"
                  >
                    Open review checklist <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </article>

          <aside className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center gap-2 text-indigo-200">
                <BookOpenCheck size={17} />
                <span className="text-sm font-medium">Available tools</span>
              </div>
              <div className="mt-4 space-y-2">
                {current.tools.map((tool) => (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => setInput(`${tool}: `)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left text-sm text-slate-200 hover:border-indigo-300/50"
                  >
                    <Lightbulb size={15} className="text-indigo-300" />
                    {tool}
                    <ChevronRight size={14} className="ml-auto text-slate-500" />
                  </button>
                ))}
              </div>
            </article>
            <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <div className="flex items-center gap-2 text-emerald-200">
                <ShieldCheck size={17} />
                <span className="text-sm font-medium">Safety and context</span>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-300">
                {evidence.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['Context engine', 'Only approved school context is included.', UsersRound],
            ['Model router', 'Tasks are routed by complexity and sensitivity.', GraduationCap],
            ['Human oversight', 'Drafts remain editable and reviewable.', MessageCircle],
          ].map(([title, text, Icon]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <Icon className="text-indigo-300" size={18} />
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row">
          <span>AI Gateway · authenticated · authorized · validated · logged</span>
          <span>School-managed learning environment</span>
        </footer>
      </div>
      {modal === 'review' && (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-slate-950/80 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="float-right text-slate-400"
              aria-label="Close review checklist"
            >
              <X size={18} />
            </button>
            <h2 id="review-title" className="text-xl font-semibold">
              Review before use
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Check curriculum alignment, age appropriateness, calculations, assumptions, and
              duplicate content before sharing with learners.
            </p>
            <div className="mt-5 space-y-3">
              {[
                'Verify learning objective',
                'Edit generated content',
                'Confirm assessment integrity',
                'Approve manually before publishing',
              ].map((item) => (
                <label key={item} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="accent-indigo-300" />
                  {item}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-6 w-full rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Done reviewing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
