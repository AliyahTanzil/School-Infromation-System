/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  MessageCircle,
  Paperclip,
  Pin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';

const submissions = [
  {
    id: 1,
    initials: 'AM',
    name: 'Amina Mensah',
    title: 'Water quality field report',
    course: 'Biology 11 • Lab report',
    score: '88%',
    status: 'Needs reply',
    updated: '12 min ago',
    unread: 2,
    color: 'mint',
  },
  {
    id: 2,
    initials: 'DK',
    name: 'David Kim',
    title: 'Climate systems reflection',
    course: 'Earth Science 10 • Reflection',
    score: 'Pending',
    status: 'Draft feedback',
    updated: '34 min ago',
    unread: 0,
    color: 'blue',
  },
  {
    id: 3,
    initials: 'LO',
    name: 'Lena Ortiz',
    title: 'Quadratic models project',
    course: 'Algebra II • Project',
    score: '92%',
    status: 'Released',
    updated: 'Yesterday',
    unread: 0,
    color: 'violet',
  },
  {
    id: 4,
    initials: 'TS',
    name: 'Theo Singh',
    title: 'Ecosystem energy transfer',
    course: 'Biology 11 • Lab report',
    score: '74%',
    status: 'Needs reply',
    updated: 'Yesterday',
    unread: 1,
    color: 'amber',
  },
];

const rubric = [
  {
    label: 'Evidence & accuracy',
    score: '4 / 5',
    note: 'Strong observations; add one source for the final claim.',
  },
  {
    label: 'Analysis',
    score: '4 / 5',
    note: 'Clear reasoning with a good connection to local water systems.',
  },
  {
    label: 'Communication',
    score: '5 / 5',
    note: 'Excellent structure and concise scientific vocabulary.',
  },
];

export default function FeedbackWorkspace() {
  const [role, setRole] = useState('Teacher');
  const [selectedId, setSelectedId] = useState(1);
  const [tab, setTab] = useState('Review');
  const [query, setQuery] = useState('');
  const [comment, setComment] = useState('');
  const [released, setReleased] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(
    () =>
      submissions.filter((item) =>
        `${item.name} ${item.title} ${item.course}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const selected = submissions.find((item) => item.id === selectedId) || submissions[0];
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  if (role !== 'Teacher') {
    return (
      <FeedbackPortal
        role={role}
        selected={selected}
        acknowledged={acknowledged}
        setAcknowledged={setAcknowledged}
        onRoleChange={setRole}
        notify={notify}
      />
    );
  }

  return (
    <main className="feedback-shell">
      <header className="feedback-header">
        <div>
          <p className="eyebrow">Module 51.11 • Assessment feedback</p>
          <h1>Feedback & Review</h1>
          <p>
            Turn marked work into a clear next step. Review submissions, anchor comments to
            evidence, and release feedback when it is ready.
          </p>
        </div>
        <div className="feedback-header-actions">
          <div className="feedback-role-toggle" aria-label="Preview role">
            <button className="active" onClick={() => setRole('Teacher')}>
              <UserRound size={15} /> Teacher
            </button>
            <button onClick={() => setRole('Student')}>
              <UserRound size={15} /> Student
            </button>
            <button onClick={() => setRole('Parent')}>
              <UsersRound size={15} /> Parent
            </button>
          </div>
          <button className="secondary-action" onClick={() => notify('Feedback export prepared')}>
            <Download size={15} /> Export
          </button>
        </div>
      </header>

      <nav className="feedback-tabs" aria-label="Feedback sections">
        {['Review', 'Feedback queue', 'Rubric library', 'Analytics', 'Audit'].map((item) => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === 'Review' || tab === 'Feedback queue' ? (
        <section className="feedback-layout">
          <aside className="feedback-inbox">
            <div className="feedback-inbox-title">
              <div>
                <span className="eyebrow">Review queue</span>
                <h2>{tab === 'Review' ? 'Submissions' : 'Needs your attention'}</h2>
              </div>
              <span className="queue-count">{filtered.length}</span>
            </div>
            <label className="feedback-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students or work"
              />
            </label>
            <div className="queue-filters">
              <button className="active">
                All <span>8</span>
              </button>
              <button>
                Unread <span>3</span>
              </button>
              <button>
                Drafts <span>2</span>
              </button>
            </div>
            <div className="submission-list">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className={`submission-item ${item.id === selectedId ? 'selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={`submission-avatar ${item.color}`}>{item.initials}</span>
                  <span className="submission-copy">
                    <strong>{item.name}</strong>
                    <span>{item.title}</span>
                    <small>{item.course}</small>
                  </span>
                  <span className="submission-meta">
                    <b
                      className={
                        item.status === 'Released'
                          ? 'released'
                          : item.status === 'Needs reply'
                            ? 'attention'
                            : ''
                      }
                    >
                      {item.status}
                    </b>
                    <small>{item.updated}</small>
                    {item.unread > 0 && <i>{item.unread}</i>}
                  </span>
                </button>
              ))}
            </div>
            <div className="feedback-privacy">
              <ShieldCheck size={16} />
              <span>
                <strong>Private by default</strong>
                <small>Only assigned staff can see drafts.</small>
              </span>
            </div>
          </aside>

          <section className="feedback-review">
            <div className="review-toolbar">
              <button className="back-link" onClick={() => notify('Back to all submissions')}>
                <ArrowLeft size={15} /> All submissions
              </button>
              <div>
                <button className="icon-button" onClick={() => notify('Submission pinned')}>
                  <Pin size={15} />
                </button>
                <button className="icon-button" onClick={() => notify('Submission archived')}>
                  <Archive size={15} />
                </button>
              </div>
            </div>
            <div className="review-title-row">
              <div>
                <p className="eyebrow">{selected.course}</p>
                <h2>{selected.title}</h2>
                <p className="review-byline">
                  <span className={`submission-avatar ${selected.color}`}>{selected.initials}</span>{' '}
                  {selected.name} submitted 14 May 2025
                </p>
              </div>
              <div className="review-score">
                <strong>{selected.score}</strong>
                <small>Current score</small>
              </div>
            </div>
            <div className="review-status-row">
              <span className={released ? 'released-pill' : 'draft-pill'}>
                {released ? 'Released to student' : 'Draft feedback'}
              </span>
              <span>
                <Clock3 size={13} /> Last saved 2 min ago
              </span>
              <span>
                <MessageCircle size={13} /> 3 comments
              </span>
            </div>
            <div className="submission-document">
              <div className="document-head">
                <span>
                  <FileText size={16} /> water-quality-field-report.pdf
                </span>
                <button onClick={() => notify('Document preview opened')}>
                  Open document <ChevronRight size={14} />
                </button>
              </div>
              <div className="document-paper">
                <p className="document-kicker">FIELD REPORT / BIOLOGY 11</p>
                <h3>Water quality across three local sites</h3>
                <p>
                  Our investigation compares pH, turbidity, and dissolved oxygen across three
                  collection sites. The data suggests that the restored wetland has the strongest
                  overall water quality.
                </p>
                <div className="document-highlight">
                  <span className="anchor-tag">A1</span>
                  <p>
                    “The wetland has the strongest overall water quality because all three
                    indicators are within the healthy range.”
                  </p>
                </div>
                <p>
                  The result is important because it shows how plant density can affect runoff and
                  filtration. Further testing across different weather conditions would improve
                  confidence in the conclusion.
                </p>
                <div className="document-signature">
                  <span>AM</span>
                  <span>Amina Mensah • Page 1 of 3</span>
                </div>
              </div>
            </div>
            <div className="review-bottom-grid">
              <section className="rubric-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Scoring guide</span>
                    <h3>Biology lab report rubric</h3>
                  </div>
                  <button onClick={() => notify('Rubric library opened')}>Edit rubric</button>
                </div>
                {rubric.map((item) => (
                  <div className="rubric-row" key={item.label}>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.note}</small>
                    </span>
                    <b>{item.score}</b>
                  </div>
                ))}
                <div className="rubric-total">
                  <span>Total rubric score</span>
                  <strong>13 / 15</strong>
                </div>
              </section>
              <section className="thread-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Conversation</span>
                    <h3>Feedback thread</h3>
                  </div>
                  <span className="thread-state">
                    <span /> Visible to student
                  </span>
                </div>
                <div className="thread-comment">
                  <span className="submission-avatar mint">MR</span>
                  <div>
                    <strong>
                      Ms. Rivera <small>Teacher • 9:42 AM</small>
                    </strong>
                    <p>
                      Your evidence is strong. Could you add one sentence explaining why the
                      dissolved oxygen result supports your conclusion?
                    </p>
                    <span className="anchor-reference">
                      <CircleAlert size={13} /> Anchored to A1
                    </span>
                  </div>
                </div>
                <div className="thread-comment student">
                  <span className="submission-avatar blue">AM</span>
                  <div>
                    <strong>
                      Amina Mensah <small>Student • 10:16 AM</small>
                    </strong>
                    <p>I added a source and clarified the link in the conclusion. Thank you!</p>
                  </div>
                </div>
                <div className="comment-composer">
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Write feedback or reply to the student..."
                  />
                  <div>
                    <button
                      className="attach-button"
                      onClick={() => notify('Attachment picker opened')}
                    >
                      <Paperclip size={15} /> Attach
                    </button>
                    <button
                      className="primary-action"
                      onClick={() => {
                        if (comment.trim()) {
                          setComment('');
                          notify('Comment added to thread');
                        }
                      }}
                    >
                      <Send size={15} /> Add comment
                    </button>
                  </div>
                </div>
              </section>
            </div>
            <div className="release-bar">
              <div>
                <strong>
                  {released
                    ? 'Feedback is visible to the student'
                    : 'Feedback is ready for a final check'}
                </strong>
                <small>
                  {released
                    ? 'Student and linked parent accounts can view this feedback.'
                    : 'Review comments, rubric scores, and visibility before releasing.'}
                </small>
              </div>
              <div>
                <button className="secondary-action" onClick={() => notify('Draft saved securely')}>
                  <Check size={15} /> Save draft
                </button>
                <button
                  className="primary-action"
                  onClick={() => {
                    setReleased(true);
                    notify('Feedback released');
                  }}
                >
                  <Sparkles size={15} /> {released ? 'Released' : 'Release feedback'}
                </button>
              </div>
            </div>
          </section>
        </section>
      ) : (
        <FeedbackAdminTab tab={tab} notify={notify} />
      )}
      {toast && (
        <div className="feedback-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </main>
  );
}

function FeedbackAdminTab({ tab, notify }) {
  const content = {
    'Rubric library': [
      'Rubric library',
      'Reusable scoring guides keep feedback consistent across departments.',
      ['Biology lab report', 'Research project', 'Oral presentation'],
    ],
    Analytics: [
      'Feedback analytics',
      'See where feedback is timely, understood, and leading to revision.',
      ['86% released within 48 hours', '72% students acknowledged', '41% submissions revised'],
    ],
    Audit: [
      'Feedback audit log',
      'A complete record of drafts, releases, visibility changes, and acknowledgments.',
      [
        'Ms. Rivera released feedback',
        'Amina acknowledged feedback',
        'Rubric updated by Department Head',
      ],
    ],
  }[tab];
  return (
    <section className="feedback-admin">
      <span className="eyebrow">Module 51.11</span>
      <h2>{content[0]}</h2>
      <p>{content[1]}</p>
      <div className="admin-stat-grid">
        {content[2].map((item, index) => (
          <article key={item}>
            <strong>
              {index === 0 && tab === 'Analytics'
                ? '86%'
                : index === 1 && tab === 'Analytics'
                  ? '72%'
                  : index === 2 && tab === 'Analytics'
                    ? '41%'
                    : '•'}
            </strong>
            <span>{item}</span>
          </article>
        ))}
      </div>
      <button className="primary-action" onClick={() => notify(`${tab} workspace opened`)}>
        <ChevronRight size={15} /> Open workspace
      </button>
    </section>
  );
}

function FeedbackPortal({ role, selected, acknowledged, setAcknowledged, onRoleChange, notify }) {
  const isParent = role === 'Parent';
  return (
    <main className="feedback-shell feedback-portal">
      <header className="feedback-header">
        <div>
          <p className="eyebrow">
            {isParent ? 'Parent view • Read only' : 'Student feedback center'}
          </p>
          <h1>{isParent ? 'Amina’s learning feedback' : 'My feedback center'}</h1>
          <p>
            {isParent
              ? 'View released feedback and teacher guidance for your learner.'
              : 'Review your teacher comments, rubric scores, and next steps in one place.'}
          </p>
        </div>
        <div className="feedback-role-toggle">
          <button onClick={() => onRoleChange('Teacher')}>
            <UserRound size={15} /> Teacher
          </button>
          <button className={!isParent ? 'active' : ''} onClick={() => onRoleChange('Student')}>
            <UserRound size={15} /> Student
          </button>
          <button className={isParent ? 'active' : ''} onClick={() => onRoleChange('Parent')}>
            <UsersRound size={15} /> Parent
          </button>
        </div>
      </header>
      <section className="portal-hero">
        <span className="submission-avatar mint">{selected.initials}</span>
        <div>
          <span className="eyebrow">Biology 11 • Released 14 May 2025</span>
          <h2>{selected.title}</h2>
          <p>Ms. Rivera has returned your work with rubric scores and an actionable next step.</p>
        </div>
        <strong className="portal-score">{selected.score}</strong>
      </section>
      <div className="portal-grid">
        <section className="portal-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Teacher feedback</span>
              <h3>What to work on next</h3>
            </div>
            <span className="released-pill">Released</span>
          </div>
          <p className="large-feedback">
            “Add one sentence explaining why the dissolved oxygen result supports your conclusion.
            Your evidence is strong and your structure is clear.”
          </p>
          <div className="next-step">
            <Sparkles size={16} />
            <span>
              <strong>Next step</strong>
              <small>Revise the conclusion and resubmit by 20 May.</small>
            </span>
          </div>
          <button
            className="primary-action"
            onClick={() => {
              setAcknowledged(true);
              notify('Feedback acknowledged');
            }}
          >
            {acknowledged ? (
              <>
                <Check size={15} /> Acknowledged
              </>
            ) : (
              'Acknowledge feedback'
            )}
          </button>
        </section>
        <section className="portal-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Rubric breakdown</span>
              <h3>13 / 15 points</h3>
            </div>
            <button onClick={() => notify('Rubric details opened')}>Details</button>
          </div>
          {rubric.map((item) => (
            <div className="rubric-row" key={item.label}>
              <span>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
              </span>
              <b>{item.score}</b>
            </div>
          ))}
        </section>
      </div>
      <div className="portal-privacy">
        <ShieldCheck size={17} />
        <span>
          <strong>{isParent ? 'Read-only parent access' : 'Your feedback is private'}</strong>
          <small>
            {isParent
              ? 'This view only includes feedback released by the school.'
              : 'You can reply to your teacher in the feedback thread.'}
          </small>
        </span>
      </div>
    </main>
  );
}
