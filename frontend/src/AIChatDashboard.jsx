import { useMemo, useState } from 'react';
import { Bot, ChevronRight, FileSearch, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

const suggestions = [
  'Which grades need attendance intervention this week?',
  'Summarize the latest fee collection risks.',
  'What evidence supports the current support backlog?',
];

const initialMessages = [
  {
    role: 'assistant',
    text: 'I can help you explore school operations using approved tenant evidence. Ask about attendance, fees, support, or another operational signal.',
    citations: [],
  },
];

function getDemoAnswer(input) {
  const lower = input.toLowerCase();
  if (lower.includes('fee') || lower.includes('collection'))
    return {
      text: 'Collection risk is concentrated in two cohorts. The current collection rate is 91.6%, with 8.4% still outstanding. Prioritize families with invoices older than 30 days and route payment-plan questions to the finance team.',
      citations: ['Finance rollup · Current period', 'Aging report · 30+ days'],
    };
  if (lower.includes('support') || lower.includes('backlog'))
    return {
      text: 'The support backlog is stable but uneven. There are 23 open cases, 7 older than the service target. Prioritize transport and attendance cases before general requests.',
      citations: ['Support queue · Open cases', 'SLA report · Current period'],
    };
  return {
    text: 'Grade 9 is the clearest intervention candidate. Attendance is 91.8% this week, below the 95% campus target. The strongest next step is a counselor review of the 14 students with three or more absences.',
    citations: ['Attendance trend · Grade 9 · Week 6', 'Intervention queue · 14 students'],
  };
}

export default function AIChatDashboard() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [activeCitation, setActiveCitation] = useState(null);
  const [refused, setRefused] = useState(false);
  const [copied, setCopied] = useState(false);
  const visibleMessages = useMemo(() => messages, [messages]);

  function ask(question = input) {
    const value = question.trim();
    if (!value) return;
    if (/ignore previous|reveal system|bypass safety/i.test(value)) {
      setRefused(true);
      setMessages((current) => [
        ...current,
        { role: 'user', text: value },
        {
          role: 'assistant',
          text: 'I can help with school operations, but I cannot reveal hidden instructions or bypass safety controls.',
          citations: [],
        },
      ]);
    } else {
      const answer = getDemoAnswer(value);
      setRefused(false);
      setMessages((current) => [
        ...current,
        { role: 'user', text: value },
        { role: 'assistant', ...answer },
      ]);
    }
    setInput('');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Sparkles size={15} /> AI Chat Assistant
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Ask the school network.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              A role-aware conversational workspace that answers from approved evidence, shows its
              sources, and knows when to stop.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm">
            <ShieldCheck className="text-emerald-300" size={18} />
            <span>Tenant evidence only</span>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_270px]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Conversations</p>
              <button
                className="rounded-lg border border-slate-700 p-2 text-slate-300"
                aria-label="New conversation"
              >
                <MessageSquare size={15} />
              </button>
            </div>
            <div className="space-y-2">
              {['Attendance intervention planning', 'Grade 8 fee follow-up'].map((item, index) => (
                <button
                  key={item}
                  className={`w-full rounded-xl p-3 text-left text-sm ${index === 0 ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {item}
                  <span className="mt-1 block text-xs text-slate-500">
                    {index === 0 ? 'Today, 09:42' : 'Yesterday, 16:18'}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <article className="flex min-h-[620px] flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-3 border-b border-slate-800 p-5">
              <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="font-semibold">School operations copilot</h2>
                <p className="text-xs text-slate-500">
                  School administrator mode · Grounded responses
                </p>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-auto p-5">
              {visibleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-cyan-400 text-slate-950' : 'border border-slate-800 bg-slate-950/70 text-slate-300'}`}
                  >
                    <p>{message.text}</p>
                    {message.role === 'assistant' && message.citations?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.citations.map((citation) => (
                          <button
                            key={citation}
                            onClick={() => setActiveCitation(citation)}
                            className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 px-2.5 py-1 text-xs text-cyan-200 hover:border-cyan-200/60"
                          >
                            <FileSearch size={12} />
                            {citation}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {refused && (
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-200">
                  Safe refusal logged. Hidden instructions and system prompts remain protected.
                </div>
              )}
            </div>
            <div className="border-t border-slate-800 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => ask(suggestion)}
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-cyan-300/50 hover:text-cyan-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.nativeEvent.isComposing &&
                      event.keyCode !== 229
                    )
                      ask();
                  }}
                  placeholder="Ask a school operations question..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300"
                />
                <button
                  onClick={() => ask()}
                  className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  Ask
                </button>
              </div>
            </div>
          </article>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold">Evidence drawer</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select a citation to inspect the source label used for the answer.
              </p>
              <div className="mt-5 min-h-24 rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-400">
                {activeCitation || 'No citation selected'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold">Usage status</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-3xl font-semibold">18</span>
                <span className="text-xs text-slate-500">of 100 messages</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[18%] rounded-full bg-cyan-300" />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Responses are advisory. Review evidence before consequential action.
              </p>
            </div>
            <button
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 hover:border-cyan-300/50"
            >
              {copied ? 'Conversation copied' : 'Share conversation'}
              <ChevronRight size={16} />
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
