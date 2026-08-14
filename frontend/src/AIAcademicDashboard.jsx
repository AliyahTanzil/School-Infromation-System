import { useState } from 'react';
import { BookOpenCheck, CheckCircle2, LockKeyhole, Send, Sparkles } from 'lucide-react';

const evidence = [
  ['Attendance trend', '94.8%', 'Attendance snapshots · Jan 2026'],
  ['Intervention group', '18 learners', 'Student support register'],
];

export default function AIAcademicDashboard() {
  const [mode, setMode] = useState('academic-coach');
  const [input, setInput] = useState('How can I support learners whose attendance is slipping?');
  const [answer, setAnswer] = useState(null);
  const modes = [
    ['academic-coach', 'Academic coach'],
    ['attendance-guide', 'Attendance guide'],
    ['family-communication', 'Family communication'],
  ];
  const ask = () => {
    if (/ignore previous|reveal.*prompt|arbitrary sql/i.test(input))
      return setAnswer({
        refused: true,
        text: 'I can’t follow instructions that bypass safety, reveal hidden prompts, or access unrestricted data.',
      });
    setAnswer({
      refused: false,
      text: 'Based on the verified school signals, start with a small attendance check-in for the intervention group, then review progress after one week. I cannot make a high-stakes decision or infer a learner diagnosis.',
    });
  };
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
              AI academic assistant
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Evidence before advice.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              A role-aware assistant for school teams. It uses verified context, shows its limits,
              and refuses unsafe requests.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            <LockKeyhole size={15} /> Protected tenant context
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-indigo-950/20">
            <div className="flex flex-wrap gap-2">
              {modes.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`rounded-full px-4 py-2 text-sm transition ${mode === key ? 'bg-indigo-400 text-slate-950' : 'border border-slate-700 text-slate-400 hover:border-indigo-300/60'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-3 text-indigo-200">
                <Sparkles size={18} />
                <span className="text-sm font-medium">Safe assistant workspace</span>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="mt-5 min-h-28 w-full resize-none bg-transparent text-lg leading-8 text-slate-100 outline-none"
                aria-label="Academic question"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  No diagnoses, high-stakes decisions, or unrestricted data access.
                </span>
                <button
                  onClick={ask}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-200"
                >
                  <Send size={16} /> Ask safely
                </button>
              </div>
            </div>
            {answer && (
              <div
                className={`mt-5 rounded-2xl border p-5 ${answer.refused ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50'}`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {answer.refused ? <LockKeyhole size={16} /> : <CheckCircle2 size={16} />}{' '}
                  {answer.refused ? 'Safe refusal' : 'Guidance with limitations'}
                </p>
                <p className="mt-3 leading-7">{answer.text}</p>
              </div>
            )}
          </article>
          <aside className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="text-sm text-slate-400">Verified evidence</p>
              <div className="mt-5 space-y-4">
                {evidence.map(([label, value, source]) => (
                  <div
                    key={label}
                    className="border-b border-slate-800 pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{source}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-3xl border border-indigo-400/20 bg-indigo-400/10 p-6">
              <div className="flex items-center gap-3 text-indigo-200">
                <BookOpenCheck size={18} />
                <p className="font-medium">Usage status</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">
                12 <span className="text-base font-normal text-slate-400">/ 40 requests</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">Resets in 18 days · Demo policy</p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
