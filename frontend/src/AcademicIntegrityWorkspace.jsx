/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gavel,
  History,
  Info,
  LockKeyhole,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

const cases = [
  {
    id: 'AI-2048',
    student: 'Jordan Williams',
    work: 'Research Project · Environmental Science',
    signal: 'Similarity 28%',
    ai: 'Elevated · low confidence',
    status: 'Under review',
    tone: 'amber',
  },
  {
    id: 'AI-2044',
    student: 'Amara Okafor',
    work: 'Quiz 04 · Algebra II',
    signal: 'Rapid completion',
    ai: 'No signal',
    status: 'Student response',
    tone: 'violet',
  },
  {
    id: 'AI-2039',
    student: 'Noah Chen',
    work: 'Lab Report · Biology',
    signal: 'Duplicate wording',
    ai: 'Not analyzed',
    status: 'Open',
    tone: 'blue',
  },
];

function Metric({ label, value, note, tone = 'mint', icon: Icon }) {
  return (
    <article className={`integrity-metric ${tone}`}>
      <span className="integrity-metric-icon">
        <Icon size={16} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function AcademicIntegrityWorkspace() {
  const [tab, setTab] = useState('review');
  const [selected, setSelected] = useState(cases[0]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      cases.filter((item) =>
        `${item.student} ${item.work} ${item.id}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };
  return (
    <main className="integrity-shell">
      <header className="integrity-header">
        <div>
          <p className="eyebrow">Module 51.21 · academic integrity</p>
          <h1>Protect the work. Review the signal.</h1>
          <p>
            Evidence-led integrity workflows for assignments, assessments, AI-assisted learning, and
            examinations. Signals guide authorized human review; they never decide a student&apos;s
            outcome.
          </p>
        </div>
        <div className="integrity-header-actions">
          <span className="integrity-privacy">
            <ShieldCheck size={14} /> Restricted school data
          </span>
          <button
            className="integrity-ghost"
            onClick={() => notify('Policy acknowledgment recorded')}
          >
            {' '}
            <LockKeyhole size={14} /> Policy controls
          </button>
          <button className="integrity-primary" onClick={() => setModal('case')}>
            <Gavel size={14} /> Create case
          </button>
        </div>
      </header>
      <nav className="integrity-tabs" aria-label="Academic integrity sections">
        {[
          ['review', 'Review queue'],
          ['policies', 'Policies'],
          ['history', 'Audit trail'],
          ['reports', 'Reports'],
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
            {key === 'review' && <b>3</b>}
          </button>
        ))}
        <span className="integrity-sync">
          <i /> Synced just now
        </span>
      </nav>
      <section className="integrity-principle">
        <Info size={17} />
        <span>
          <strong>Presumption of innocence</strong>
          <small>
            A detection result is evidence for review, not proof of misconduct. Consequential
            decisions require authorized human assessment.
          </small>
        </span>
        <button onClick={() => setModal('policy')}>
          Read policy <ChevronRight size={14} />
        </button>
      </section>
      <section className="integrity-metrics">
        <Metric
          label="Open review signals"
          value="12"
          note="3 need attention today"
          tone="amber"
          icon={AlertTriangle}
        />
        <Metric
          label="Cases under review"
          value="7"
          note="All assigned to reviewers"
          icon={Gavel}
        />
        <Metric
          label="Student responses"
          value="4"
          note="Awaiting evaluation"
          tone="violet"
          icon={MessageSquare}
        />
        <Metric
          label="Resolved without violation"
          value="91%"
          note="This term · reviewed cases"
          tone="blue"
          icon={CheckCircle2}
        />
      </section>
      <div className="integrity-grid">
        <section className="integrity-panel">
          <div className="integrity-section-heading">
            <div>
              <span className="integrity-kicker">Authorized review</span>
              <h2>Integrity review queue</h2>
            </div>
            <div className="integrity-search">
              <Search size={14} />
              <input
                aria-label="Search integrity cases"
                placeholder="Search student, case, or work"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="integrity-case-list">
            {filtered.map((item) => (
              <button
                key={item.id}
                className={`integrity-case ${selected.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelected(item)}
              >
                <span className={`integrity-case-icon ${item.tone}`}>
                  <FileText size={16} />
                </span>
                <span>
                  <strong>{item.student}</strong>
                  <small>{item.work}</small>
                  <small>
                    {item.id} · {item.signal}
                  </small>
                </span>
                <em className={`integrity-badge ${item.tone}`}>{item.status}</em>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="integrity-empty">No cases match this search.</div>
          )}
          <div className="integrity-footer">
            <span>
              <ShieldCheck size={13} /> Evidence access is role-controlled
            </span>
            <button className="integrity-link" onClick={() => setTab('history')}>
              View audit trail <ChevronRight size={13} />
            </button>
          </div>
        </section>
        <div className="integrity-column">
          <section className="integrity-panel integrity-detail">
            <div className="integrity-section-heading">
              <div>
                <span className="integrity-kicker">Selected case · {selected.id}</span>
                <h2>{selected.student}</h2>
              </div>
              <em className={`integrity-badge ${selected.tone}`}>{selected.status}</em>
            </div>
            <p className="integrity-work">{selected.work}</p>
            <div className="integrity-signals">
              <div>
                <span>Similarity signal</span>
                <strong>{selected.signal}</strong>
                <small>Inspect actual matches before interpreting.</small>
              </div>
              <div>
                <span>AI content indicator</span>
                <strong>{selected.ai}</strong>
                <small>Detector outputs may be false positive or negative.</small>
              </div>
            </div>
            <div className="integrity-detail-actions">
              <button className="integrity-primary" onClick={() => setModal('evidence')}>
                Review evidence
              </button>
              <button className="integrity-ghost" onClick={() => setModal('response')}>
                Student response
              </button>
            </div>
          </section>
          <section className="integrity-panel">
            <div className="integrity-section-heading">
              <div>
                <span className="integrity-kicker">Submission trace</span>
                <h2>Version history</h2>
              </div>
              <History size={17} className="integrity-spark" />
            </div>
            <div className="integrity-timeline">
              <span>
                <b>Final submission</b>
                <small>Today, 10:45 · submitted</small>
              </span>
              <span>
                <b>Version 3</b>
                <small>Today, 10:12 · draft replaced</small>
              </span>
              <span>
                <b>Version 2</b>
                <small>Today, 10:05 · file uploaded</small>
              </span>
              <span>
                <b>Version 1</b>
                <small>Today, 09:32 · draft saved</small>
              </span>
            </div>
          </section>
        </div>
      </div>
      <section className="integrity-bottom-grid">
        <section className="integrity-panel">
          <div className="integrity-section-heading">
            <div>
              <span className="integrity-kicker">Assessment controls</span>
              <h2>Policy coverage</h2>
            </div>
            <button className="integrity-link" onClick={() => setTab('policies')}>
              Manage policies <ChevronRight size={13} />
            </button>
          </div>
          <div className="integrity-policy-grid">
            <span>
              <BookOpen size={15} />
              <b>Assignments</b>
              <small>AI disclosure · version tracking</small>
            </span>
            <span>
              <Gavel size={15} />
              <b>Quizzes</b>
              <small>Randomization · attempt limits</small>
            </span>
            <span>
              <LockKeyhole size={15} />
              <b>Examinations</b>
              <small>Identity · time · audit trail</small>
            </span>
          </div>
        </section>
        <section className="integrity-panel integrity-safe">
          <ShieldCheck size={19} />
          <h2>Review, don&apos;t accuse</h2>
          <p>
            Similarity percentages are not plagiarism percentages. Tab changes are not proof of
            cheating. Every case preserves evidence, student response, reviewer, and decision
            history.
          </p>
          <button className="integrity-primary" onClick={() => notify('Integrity guidance opened')}>
            Open reviewer guidance
          </button>
        </section>
      </section>
      <footer className="integrity-footer">
        <span>SAIS academic integrity · tenant-scoped workspace</span>
        <span>Policy v3.4 · human review required</span>
      </footer>
      {modal && (
        <div className="integrity-modal" role="dialog" aria-modal="true">
          <div className="integrity-modal-card">
            <button
              className="integrity-modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <span className="integrity-modal-icon">
              <ShieldCheck size={22} />
            </span>
            <h2>
              {modal === 'case'
                ? 'Create integrity case'
                : modal === 'evidence'
                  ? 'Evidence review'
                  : modal === 'response'
                    ? 'Student response'
                    : 'Academic integrity policy'}
            </h2>
            <p>
              {modal === 'evidence'
                ? 'Review the original submission, version history, similarity passages, and AI indicator together. No outcome is applied from this screen.'
                : modal === 'response'
                  ? 'The student may provide an explanation, drafts, sources, or an AI assistance declaration where policy permits.'
                  : 'This workflow preserves student rights, evidence traceability, privacy, and authorized human decision-making.'}
            </p>
            <div className="integrity-modal-list">
              <span>
                <Info size={14} /> Detection signals are review evidence
              </span>
              <span>
                <ShieldCheck size={14} /> Decisions require an authorized reviewer
              </span>
              <span>
                <History size={14} /> Finalized evidence is audit-traced
              </span>
            </div>
            <button
              className="integrity-primary"
              onClick={() => {
                setModal(null);
                notify('Workflow action recorded');
              }}
            >
              Continue safely
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="integrity-toast">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}
    </main>
  );
}
