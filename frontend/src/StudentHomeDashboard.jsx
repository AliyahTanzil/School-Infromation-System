/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Inbox,
  MapPin,
  MoreHorizontal,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';

const schedule = [
  {
    time: '08:00 – 08:50',
    title: 'Advanced Mathematics',
    room: 'Room 204 · Ms. Adeyemi',
    tone: 'mint',
    status: 'NOW',
  },
  {
    time: '09:00 – 09:50',
    title: 'World Literature',
    room: 'Room 118 · Mr. Mensah',
    tone: 'violet',
    status: 'NEXT',
  },
  {
    time: '10:10 – 11:00',
    title: 'Physics Lab',
    room: 'Science Wing · Dr. Chen',
    tone: 'blue',
    status: 'UPCOMING',
  },
  {
    time: '13:00 – 13:50',
    title: 'Civic Leadership',
    room: 'Room 302 · Ms. Okafor',
    tone: 'amber',
    status: 'UPCOMING',
  },
];
const work = [
  {
    title: 'Quadratic Functions',
    meta: 'Mathematics · Due today',
    tone: 'amber',
    kind: 'Assignment',
  },
  {
    title: 'The Great Gatsby response',
    meta: 'Literature · Due tomorrow',
    tone: 'violet',
    kind: 'Essay',
  },
  { title: 'Newtonian Motion quiz', meta: 'Physics · Friday', tone: 'blue', kind: 'Quiz' },
];
const classes = [
  { name: 'Advanced Mathematics', teacher: 'Ms. Adeyemi', mark: 'A−', tone: 'mint' },
  { name: 'World Literature', teacher: 'Mr. Mensah', mark: 'B+', tone: 'violet' },
  { name: 'Physics', teacher: 'Dr. Chen', mark: 'A', tone: 'blue' },
  { name: 'Civic Leadership', teacher: 'Ms. Okafor', mark: 'A−', tone: 'amber' },
];

function Badge({ children, tone = '' }) {
  return <span className={`student-badge ${tone}`}>{children}</span>;
}
function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="student-section-header">
      <div>
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function StudentHomeDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const filteredClasses = useMemo(
    () =>
      classes.filter((item) =>
        `${item.name} ${item.teacher}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <main className="student-home-shell">
      <header className="student-home-header">
        <div className="student-identity">
          <div className="student-avatar">JA</div>
          <div>
            <span className="eyebrow">Tuesday, 18 March 2025 · Year 11</span>
            <h1>Good morning, Jordan.</h1>
            <p>Your learning day is ready. Here’s what needs your attention.</p>
          </div>
        </div>
        <div className="student-header-actions">
          <button
            className="student-icon-button"
            aria-label="Open notifications"
            onClick={() => setShowNotifications(true)}
          >
            <Bell />
            <i />
          </button>
          <a className="student-primary" href="/calendar">
            <CalendarDays /> Open calendar
          </a>
        </div>
      </header>
      <nav className="student-tabs" aria-label="Student dashboard sections">
        {['Overview', 'My classes', 'Progress', 'Resources'].map((tab) => (
          <button
            className={activeTab === tab ? 'active' : ''}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      {activeTab === 'Overview' && (
        <>
          <section className="student-stats">
            <article>
              <span>Attendance</span>
              <strong>96%</strong>
              <small>
                <CheckCircle2 /> 2% above target
              </small>
            </article>
            <article className="mint">
              <span>Current average</span>
              <strong>88.4%</strong>
              <small>
                <TrendingUp /> Up 3.2% this term
              </small>
            </article>
            <article className="violet">
              <span>Work due</span>
              <strong>03</strong>
              <small>
                <Clock3 /> 1 due today
              </small>
            </article>
            <article className="amber">
              <span>Unread updates</span>
              <strong>04</strong>
              <small>
                <Inbox /> From your teachers
              </small>
            </article>
          </section>
          <section className="student-main-grid">
            <div className="student-column">
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Tuesday schedule"
                  title="Your day"
                  action={
                    <a className="student-link" href="/calendar">
                      Full timetable <ChevronRight />
                    </a>
                  }
                />
                <div className="student-schedule">
                  {schedule.map((item) => (
                    <div
                      className={`student-schedule-item ${item.status === 'NOW' ? 'now' : ''}`}
                      key={item.title}
                    >
                      <span className="student-time">
                        <Clock3 /> {item.time}
                      </span>
                      <span className={`student-schedule-line ${item.tone}`} />
                      <div className="student-schedule-copy">
                        <strong>{item.title}</strong>
                        <small>
                          <MapPin /> {item.room}
                        </small>
                      </div>
                      <Badge tone={item.tone}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </section>
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Stay on track"
                  title="Upcoming work"
                  action={
                    <a className="student-link" href="/assignments">
                      View all <ChevronRight />
                    </a>
                  }
                />
                <div className="student-work-list">
                  {work.map((item) => (
                    <a className="student-work-item" href="/assignments" key={item.title}>
                      <span className={`student-work-icon ${item.tone}`}>
                        {item.kind === 'Quiz' ? (
                          <Target />
                        ) : item.kind === 'Essay' ? (
                          <FileText />
                        ) : (
                          <BookOpen />
                        )}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </span>
                      <MoreHorizontal />
                    </a>
                  ))}
                </div>
              </section>
            </div>
            <div className="student-column">
              <section className="student-panel student-progress">
                <SectionHeader
                  eyebrow="Term progress"
                  title="You’re building momentum"
                  action={
                    <a className="student-panel-link" href="/results">
                      Details <ChevronRight />
                    </a>
                  }
                />
                <div className="student-score">
                  <strong>88.4</strong>
                  <span>/ 100</span>
                  <b>
                    +3.2% <small>vs last term</small>
                  </b>
                </div>
                <div className="student-progress-bar">
                  <i />
                </div>
                <div className="student-progress-footer">
                  <span>
                    <Target /> Target: 85%
                  </span>
                  <span>
                    <Sparkles /> On track
                  </span>
                </div>
                <div className="student-mini-chart" aria-label="Weekly progress chart">
                  <i style={{ height: '34%' }} />
                  <i style={{ height: '50%' }} />
                  <i style={{ height: '45%' }} />
                  <i style={{ height: '68%' }} />
                  <i style={{ height: '61%' }} />
                  <i style={{ height: '83%' }} />
                  <i style={{ height: '76%' }} />
                </div>
              </section>
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Enrolled this term"
                  title="My classes"
                  action={
                    <button
                      className="student-panel-link"
                      onClick={() => setActiveTab('My classes')}
                    >
                      Manage <ChevronRight />
                    </button>
                  }
                />
                <label className="student-search">
                  <Search />
                  <span className="sr-only">Search classes</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search classes"
                  />
                </label>
                <div className="student-class-list">
                  {filteredClasses.map((item) => (
                    <a className="student-class" href="/grades" key={item.name}>
                      <span className={`class-mark ${item.tone}`}>{item.mark}</span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.teacher}</small>
                      </span>
                      <ChevronRight />
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
      {activeTab !== 'Overview' && (
        <section className="student-empty-panel">
          <GraduationCap />
          <h2>{activeTab}</h2>
          <p>
            This student workspace is ready for the next learning module. Your current overview
            remains available from the first tab.
          </p>
          <button className="student-primary" onClick={() => setActiveTab('Overview')}>
            Return to overview
          </button>
        </section>
      )}
      <footer className="student-footer">
        <span>
          <ShieldCheckIcon /> Your dashboard is private to your account.
        </span>
        <span>Last synced just now</span>
      </footer>
      {showNotifications && (
        <div
          className="student-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-notifications-title"
        >
          <div className="student-modal-card">
            <button
              className="student-icon-button modal-close"
              aria-label="Close notifications"
              onClick={() => setShowNotifications(false)}
            >
              <X />
            </button>
            <span className="section-kicker">Student inbox</span>
            <h2 id="student-notifications-title">Your updates</h2>
            <p>
              Ms. Adeyemi shared feedback on your mathematics submission. Your next class starts in
              12 minutes.
            </p>
            <a
              className="student-primary"
              href="/notifications"
              onClick={() => setShowNotifications(false)}
            >
              Open notification center
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
function ShieldCheckIcon() {
  return <CheckCircle2 />;
}
