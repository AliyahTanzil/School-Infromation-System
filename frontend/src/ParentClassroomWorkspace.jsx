/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  HeartHandshake,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from 'lucide-react';

const children = [
  {
    id: 'maya',
    name: 'Maya Johnson',
    grade: 'Grade 8 · Cedar House',
    initials: 'MJ',
    accent: 'mint',
    average: '87%',
    attendance: '96%',
    missing: 2,
    unread: 3,
  },
  {
    id: 'eli',
    name: 'Eli Johnson',
    grade: 'Grade 5 · North House',
    initials: 'EJ',
    accent: 'violet',
    average: '91%',
    attendance: '98%',
    missing: 0,
    unread: 1,
  },
];

const schedule = [
  {
    time: '09:00',
    subject: 'Mathematics',
    detail: 'Ms. N. Patel · Room 204',
    state: 'live',
    accent: 'mint',
  },
  {
    time: '10:20',
    subject: 'Integrated Science',
    detail: 'Mr. D. Mensah · Lab 2',
    state: 'next',
    accent: 'violet',
  },
  {
    time: '13:15',
    subject: 'English Literature',
    detail: 'Ms. L. Okafor · Room 118',
    state: '',
    accent: 'blue',
  },
];

const assignments = [
  {
    title: 'Quadratic Patterns',
    subject: 'Mathematics',
    due: 'Due today · 4:00 PM',
    status: 'Due soon',
    accent: 'amber',
  },
  {
    title: 'The River Between · Reading log',
    subject: 'English Literature',
    due: 'Due Mar 18',
    status: 'In progress',
    accent: 'violet',
  },
  {
    title: 'Ecosystems Field Notes',
    subject: 'Integrated Science',
    due: 'Submitted Mar 12',
    status: 'Released',
    accent: 'mint',
  },
];

const classes = [
  { name: 'Mathematics', teacher: 'Nadia Patel', score: '92%', initials: 'NP', accent: 'mint' },
  {
    name: 'English Literature',
    teacher: 'Lina Okafor',
    score: '84%',
    initials: 'LO',
    accent: 'violet',
  },
  {
    name: 'Integrated Science',
    teacher: 'Daniel Mensah',
    score: '88%',
    initials: 'DM',
    accent: 'blue',
  },
];

function StudentSelector({ selected, onChange }) {
  return (
    <div className="parent-student-selector">
      <div className={`parent-child-avatar ${selected.accent}`}>{selected.initials}</div>
      <label>
        <span>Viewing classroom</span>
        <select
          value={selected.id}
          onChange={(event) => onChange(children.find((child) => child.id === event.target.value))}
        >
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </label>
      <ChevronDown aria-hidden="true" />
    </div>
  );
}

export default function ParentClassroomWorkspace() {
  const [selectedId, setSelectedId] = useState(children[0].id);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [toast, setToast] = useState('');
  const selected = useMemo(
    () => children.find((child) => child.id === selectedId) || children[0],
    [selectedId]
  );
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  return (
    <main className="parent-classroom-shell">
      <header className="parent-classroom-header">
        <div>
          <p className="eyebrow">Parent classroom · Read-only view</p>
          <h1>Stay close to the learning.</h1>
          <p>
            Monitor progress, celebrate wins, and understand what your learner needs next. Your
            access is limited to linked student records.
          </p>
        </div>
        <div className="parent-header-actions">
          <span className="parent-privacy">
            <ShieldCheck aria-hidden="true" /> Guardian access verified
          </span>
          <button
            className="parent-icon-button"
            onClick={() => notify('You have 4 new classroom updates.')}
            aria-label="Open notifications"
          >
            <Bell aria-hidden="true" />
            <i />
          </button>
          <button
            className="parent-primary"
            onClick={() => notify('Message composer opened for the homeroom team.')}
          >
            <MessageCircle aria-hidden="true" /> Message school
          </button>
        </div>
      </header>

      <div className="parent-toolbar">
        <StudentSelector selected={selected} onChange={(child) => setSelectedId(child.id)} />
        <div className="parent-toolbar-links">
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'active' : ''}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={activeTab === 'attendance' ? 'active' : ''}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={activeTab === 'messages' ? 'active' : ''}
          >
            Messages <b>2</b>
          </button>
        </div>
        <span className="parent-last-sync">
          <CheckCircle2 aria-hidden="true" /> Synced 4 min ago
        </span>
      </div>

      {activeTab === 'overview' && (
        <>
          <section className="parent-stat-grid" aria-label="Student summary">
            <article className="parent-stat mint">
              <span>Current average</span>
              <strong>{selected.average}</strong>
              <small>
                <TrendingUp aria-hidden="true" /> +3.2% this term
              </small>
            </article>
            <article className="parent-stat blue">
              <span>Attendance</span>
              <strong>{selected.attendance}</strong>
              <small>
                <CalendarDays aria-hidden="true" /> 1 excused absence
              </small>
            </article>
            <article className="parent-stat amber">
              <span>Work to review</span>
              <strong>{selected.missing}</strong>
              <small>
                <AlertTriangle aria-hidden="true" /> Needs attention
              </small>
            </article>
            <article className="parent-stat violet">
              <span>Teacher notes</span>
              <strong>{selected.unread}</strong>
              <small>
                <Inbox aria-hidden="true" /> Unread updates
              </small>
            </article>
          </section>
          <div className="parent-main-grid">
            <div className="parent-column">
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Today · Monday, March 16</span>
                    <h2>Classroom schedule</h2>
                  </div>
                  <button
                    className="parent-link"
                    onClick={() => notify('Opening full academic calendar.')}
                  >
                    <CalendarDays aria-hidden="true" /> View calendar
                  </button>
                </div>
                <div className="parent-schedule">
                  {schedule.map((item) => (
                    <div className="parent-schedule-item" key={item.time}>
                      <time>{item.time}</time>
                      <i className={`parent-schedule-line ${item.accent}`} />
                      <div>
                        <strong>{item.subject}</strong>
                        <small>{item.detail}</small>
                      </div>
                      <span className={`parent-badge ${item.state}`}>
                        {item.state === 'live'
                          ? 'In progress'
                          : item.state === 'next'
                            ? 'Up next'
                            : 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Learning activity</span>
                    <h2>Assignments and feedback</h2>
                  </div>
                  <button
                    className="parent-link"
                    onClick={() => notify('Showing all assignments.')}
                  >
                    <FileText aria-hidden="true" /> View all
                  </button>
                </div>
                <div className="parent-assignment-list">
                  {assignments.map((item) => (
                    <button
                      className="parent-assignment"
                      key={item.title}
                      onClick={() => setSelectedAssignment(item)}
                    >
                      <span className={`parent-work-icon ${item.accent}`}>
                        <FileText aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.subject} · {item.due}
                        </small>
                      </span>
                      <span className={`parent-badge ${item.accent}`}>{item.status}</span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <div className="parent-column">
              <section className="parent-panel parent-progress">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Term progress</span>
                    <h2>Academic snapshot</h2>
                  </div>
                  <Sparkles aria-hidden="true" className="parent-spark" />
                </div>
                <div className="parent-score">
                  <strong>{selected.average}</strong>
                  <span>overall average</span>
                  <b>On track</b>
                </div>
                <div className="parent-progress-bar">
                  <i />
                </div>
                <div className="parent-progress-footer">
                  <span>Term 2 of 3</span>
                  <span>+4 points since Term 1</span>
                </div>
                <div className="parent-mini-chart" aria-label="Academic progress trend">
                  {[44, 55, 50, 62, 68, 76, 81, 86].map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="parent-progress-footer">
                  <span>Jan 12</span>
                  <span>Now</span>
                </div>
              </section>
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Connected classroom</span>
                    <h2>Classes and teachers</h2>
                  </div>
                  <button
                    className="parent-link"
                    onClick={() => notify('Teacher directory opened.')}
                  >
                    <UsersRound aria-hidden="true" /> Directory
                  </button>
                </div>
                <div className="parent-class-list">
                  {classes.map((item) => (
                    <button
                      className="parent-class"
                      key={item.name}
                      onClick={() => notify(`Opening ${item.name} progress.`)}
                    >
                      <span className={`parent-class-mark ${item.accent}`}>{item.initials}</span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.teacher}</small>
                      </span>
                      <b>{item.score}</b>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
      {activeTab === 'attendance' && (
        <section className="parent-empty-panel">
          <CalendarDays aria-hidden="true" />
          <h2>Attendance overview</h2>
          <p>
            {selected.name} has attended 96% of scheduled lessons this term. Attendance details,
            excused absences, and upcoming school days are available in the full attendance report.
          </p>
          <button className="parent-primary" onClick={() => notify('Attendance report requested.')}>
            Request full report
          </button>
        </section>
      )}
      {activeTab === 'messages' && (
        <section className="parent-empty-panel">
          <HeartHandshake aria-hidden="true" />
          <h2>School messages</h2>
          <p>
            Two teacher updates are waiting for your review. Messages are scoped to {selected.name}
            &apos;s linked classroom team.
          </p>
          <button className="parent-primary" onClick={() => notify('Opening message center.')}>
            Open message center
          </button>
        </section>
      )}
      <footer className="parent-footer">
        <span>
          <ShieldCheck aria-hidden="true" /> You are viewing linked classroom data only.
        </span>
        <span>Need help? Contact your school administrator.</span>
      </footer>
      {selectedAssignment && (
        <div
          className="parent-modal"
          role="presentation"
          onClick={() => setSelectedAssignment(null)}
        >
          <section
            className="parent-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-assignment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="parent-icon-button modal-close"
              onClick={() => setSelectedAssignment(null)}
              aria-label="Close assignment"
            >
              <X aria-hidden="true" />
            </button>
            <span className={`parent-work-icon ${selectedAssignment.accent}`}>
              <BookOpen aria-hidden="true" />
            </span>
            <h2 id="parent-assignment-title">{selectedAssignment.title}</h2>
            <p>
              {selectedAssignment.subject} · {selectedAssignment.due}
            </p>
            <div className="parent-note">
              <Sparkles aria-hidden="true" />
              <span>
                <strong>Family view</strong>
                <small>
                  Teacher feedback and submission details will appear here once released by the
                  school.
                </small>
              </span>
            </div>
            <button
              className="parent-primary"
              onClick={() => {
                setSelectedAssignment(null);
                notify('Opening the linked classroom resource.');
              }}
            >
              Open classroom resource
            </button>
          </section>
        </div>
      )}
      {toast && (
        <div className="parent-toast" role="status">
          <CheckCircle2 aria-hidden="true" /> {toast}
        </div>
      )}
    </main>
  );
}
