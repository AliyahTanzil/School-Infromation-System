import { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  History,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const sections = [
  [
    'Executive summary',
    'School performance is trending positively: engagement is above target and attendance is close to the operating threshold. Finance collections improved, while Grade 9 attendance needs a focused intervention.',
    '92%',
  ],
  [
    'Academic outlook',
    'Learning engagement reached 87.2%, exceeding the 85% target. The strongest signal is sustained improvement across the last three reporting periods.',
    '89%',
  ],
  [
    'Recommended actions',
    'Review Grade 9 attendance drivers, keep current engagement routines, and schedule a finance collection checkpoint before the next reporting close.',
    '86%',
  ],
];

const evidence = [
  ['Attendance rate', '94.8%', 'attendance-jan-2026'],
  ['Fee collection', '91.6%', 'collections-jan-2026'],
  ['Learning engagement', '87.2%', 'engagement-jan-2026'],
];

export default function AIReportsDashboard() {
  const [status, setStatus] = useState('Needs review');
  const [exportStatus, setExportStatus] = useState('Export report');
  const [selected, setSelected] = useState('Executive performance brief');

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-10 text-slate-100 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm text-indigo-300">
              <Sparkles size={16} /> Evidence-backed report studio
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
              AI reports with a human signature.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Generate clear school narratives from approved evidence, validate every claim, and
              keep consequential decisions in review.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <ShieldCheck size={17} className="text-emerald-300" /> Tenant-scoped · review required
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Report type</p>
            <div className="mt-4 space-y-2">
              {[
                'Executive performance brief',
                'Attendance intervention digest',
                'Term finance narrative',
              ].map((name) => (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${selected === name ? 'border-indigo-300/60 bg-indigo-400/10 text-indigo-100' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  {name}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
            <div className="mt-8 border-t border-slate-800 pt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Academic period</p>
              <p className="mt-2 text-lg font-medium">January 2026</p>
              <p className="mt-1 text-sm text-slate-500">All campuses · active tenant</p>
            </div>
            <button
              onClick={() => setStatus('Generating')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-200"
            >
              <Sparkles size={16} /> Generate new draft
            </button>
          </aside>

          <div className="space-y-5">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-slate-400">{selected}</p>
                  <h2 className="mt-1 text-2xl font-semibold">January school performance brief</h2>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/30 px-3 py-1.5 text-xs text-amber-200">
                  <ClipboardCheck size={14} /> {status}
                </span>
              </div>
              <div className="mt-6 space-y-5">
                {sections.map(([title, body, confidence]) => (
                  <div key={title}>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium">{title}</h3>
                      <span className="text-xs text-slate-500">Confidence {confidence}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                <button
                  onClick={() => setStatus('Approved')}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-3 py-2 text-xs font-semibold text-slate-950"
                >
                  <CheckCircle2 size={14} /> Approve version
                </button>
                <button
                  onClick={() => setExportStatus('Queued · PDF')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
                >
                  <FileDown size={14} /> {exportStatus}
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
                  <History size={14} /> Version history
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Evidence ledger</p>
                <h2 className="mt-1 text-xl font-semibold">Every narrative has a source</h2>
              </div>
              <span className="text-xs text-emerald-300">3 verified inputs</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {evidence.map(([label, value, ref]) => (
                <div key={ref} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs text-slate-500">{ref}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm text-slate-400">Validation status</p>
            <h2 className="mt-1 text-xl font-semibold">Ready for review</h2>
            <div className="mt-5 space-y-3 text-sm">
              {[
                'All numeric claims matched evidence',
                'No student-level diagnosis generated',
                'Approval required before publication',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
