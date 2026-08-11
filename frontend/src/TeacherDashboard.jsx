/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  UsersRound,
  X,
} from 'lucide-react';

const schedule = [
  {
    time: '08:00 – 09:00',
    subject: 'Mathematics',
    className: 'JSS 2A',
    room: 'Room 4',
    state: 'now',
  },
  {
    time: '10:00 – 11:00',
    subject: 'Mathematics',
    className: 'JSS 3B',
    room: 'Room 7',
    state: 'next',
  },
  { time: '13:30 – 14:30', subject: 'Physics', className: 'JSS 1C', room: 'Lab 2', state: 'later' },
];
const classes = [
  { name: 'JSS 1A', subject: 'Mathematics', students: 32, color: 'mint' },
  { name: 'JSS 2A', subject: 'Mathematics', students: 28, color: 'blue' },
  { name: 'JSS 3B', subject: 'Physics', students: 31, color: 'violet' },
];
const work = [
  {
    title: 'Mathematics Assignment 3',
    detail: '18 submissions awaiting review',
    tone: 'amber',
    icon: ClipboardCheck,
  },
  { title: 'Physics Quiz', detail: '7 manual reviews', tone: 'violet', icon: FileCheck2 },
  { title: 'Research Project', detail: '4 late submissions', tone: 'pink', icon: AlertTriangle },
];
const activity = [
  ['Aisha Kamara', 'submitted Mathematics Assignment 3', '12 min ago'],
  ['JSS 2A', 'attendance marked for today’s lesson', '38 min ago'],
  ['Academic Office', 'published the Term 1 examination calendar', '1 hr ago'],
];

function StatCard({ label, value, detail, tone, href }) {
  return (
    <a className={`teacher-stat ${tone}`} href={href}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        {detail}
        <ArrowUpRight size={12} />
      </small>
    </a>
  );
}
function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="teacher-section-header">
      <div>
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function TeacherDashboard() {
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  }, []);
  const filteredClasses = classes.filter((item) =>
    `${item.name} ${item.subject}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div>
          <p className="eyebrow">SAIS Digital Classroom · Teacher workspace</p>
          <h1>{greeting}, Mr. Sesay</h1>
          <p>
            Here’s the operational view for your teaching day. Mathematics Department · 2026/2027
            Academic Year · Term 1
          </p>
        </div>
        <div className="teacher-header-actions">
          <button className="teacher-ghost" onClick={() => setSelectedClass('new')}>
            <Plus size={15} /> Quick action
          </button>
          <div className="teacher-avatar">MS</div>
        </div>
      </header>
      <nav className="teacher-actions" aria-label="Teacher shortcuts">
        <a href="/classroom">
          <LayoutDashboard size={15} /> Open classroom
        </a>
        <a href="/gradebook">
          <ClipboardCheck size={15} /> Gradebook
        </a>
        <a href="/attendance">
          <CheckCircle2 size={15} /> Take attendance
        </a>
        <a href="/calendar">
          <CalendarDays size={15} /> Academic calendar
        </a>
        <a href="/notifications">
          <MessageSquare size={15} /> Notifications <b>3</b>
        </a>
      </nav>
      <section className="teacher-stats">
        <StatCard
          label="Today’s classes"
          value="3"
          detail="2 remaining"
          tone="mint"
          href="#schedule"
        />
        <StatCard
          label="Pending grading"
          value="25"
          detail="Across 3 assessments"
          tone="amber"
          href="#grading"
        />
        <StatCard
          label="Missing submissions"
          value="11"
          detail="Needs follow-up"
          tone="pink"
          href="#grading"
        />
        <StatCard
          label="Upcoming events"
          value="4"
          detail="Next 7 days"
          tone="blue"
          href="/calendar"
        />
      </section>
      <section className="teacher-grid-main">
        <div className="teacher-column">
          <section className="teacher-panel" id="schedule">
            <SectionHeader
              eyebrow="Today · Tuesday 18 August"
              title="Today’s schedule"
              action={
                <a className="teacher-link" href="/calendar">
                  View calendar <ChevronRight size={13} />
                </a>
              }
            />
            <div className="schedule-list">
              {schedule.map((item) => (
                <article className={`schedule-item ${item.state}`} key={item.time}>
                  <div className="schedule-time">
                    <Clock3 size={13} />
                    {item.time}
                  </div>
                  <div className="schedule-line" />
                  <div className="schedule-copy">
                    <div>
                      <strong>{item.subject}</strong>
                      <span>
                        {item.className} · {item.room}
                      </span>
                    </div>
                    {item.state === 'now' ? (
                      <span className="status-pill live">NOW</span>
                    ) : item.state === 'next' ? (
                      <span className="status-pill next">Next lesson</span>
                    ) : (
                      <span className="status-pill">Upcoming</span>
                    )}
                    <div className="schedule-buttons">
                      {item.state === 'now' && (
                        <button className="teacher-primary">
                          <LayoutDashboard size={13} /> Open classroom
                        </button>
                      )}
                      {item.state === 'next' && (
                        <button className="teacher-ghost">
                          <UsersRound size={13} /> Open class
                        </button>
                      )}
                      {item.state === 'later' && (
                        <button className="icon-button" aria-label="More lesson actions">
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="teacher-panel" id="grading">
            <SectionHeader
              eyebrow="Action required"
              title="Pending grading"
              action={
                <a className="teacher-link" href="/gradebook">
                  Open gradebook <ChevronRight size={13} />
                </a>
              }
            />
            <div className="teacher-work-list">
              {work.map(({ title, detail, tone, icon: Icon }) => (
                <a className="teacher-work-item" href="/gradebook" key={title}>
                  <span className={`work-icon ${tone}`}>
                    <Icon size={16} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  <ChevronRight size={15} />
                </a>
              ))}
            </div>
          </section>
        </div>
        <aside className="teacher-column">
          <section className="teacher-panel">
            <SectionHeader
              eyebrow="Teaching load"
              title="My classes"
              action={
                <button
                  className="icon-button"
                  onClick={() => setSelectedClass('search')}
                  aria-label="Search classes"
                >
                  <Search size={15} />
                </button>
              }
            />
            <div className="teacher-search">
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search classes"
              />
            </div>
            <div className="teacher-class-list">
              {filteredClasses.map((item) => (
                <button
                  className="teacher-class"
                  key={item.name}
                  onClick={() => setSelectedClass(item.name)}
                >
                  <span className={`class-mark ${item.color}`}>
                    <BookOpen size={15} />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.subject} · {item.students} students
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <a className="teacher-panel-link" href="/classroom">
              View all classrooms <ArrowUpRight size={13} />
            </a>
          </section>
          <section className="teacher-panel performance">
            <SectionHeader
              eyebrow="Term 1 snapshot"
              title="Student performance"
              action={
                <a className="teacher-link" href="/analytics">
                  Details <ChevronRight size={13} />
                </a>
              }
            />
            <div className="performance-score">
              <strong>78%</strong>
              <span>average class performance</span>
              <b>
                +6.4% <small>vs last term</small>
              </b>
            </div>
            <div className="performance-bar">
              <i />
            </div>
            <div className="performance-footer">
              <span>
                <UsersRound size={13} />
                91 students tracked
              </span>
              <span>
                <AlertTriangle size={13} />3 academic alerts
              </span>
            </div>
          </section>
        </aside>
      </section>
      <section className="teacher-panel activity-panel">
        <SectionHeader
          eyebrow="Live workspace activity"
          title="Recent activity"
          action={
            <a className="teacher-link" href="/notifications">
              See all notifications <ChevronRight size={13} />
            </a>
          }
        />
        <div className="activity-list">
          {activity.map(([name, message, time]) => (
            <div className="activity-item" key={`${name}-${time}`}>
              <span className="activity-dot" />
              <span>
                <strong>{name}</strong> {message}
              </span>
              <small>{time}</small>
            </div>
          ))}
        </div>
      </section>
      {selectedClass && (
        <div className="teacher-modal" role="dialog" aria-modal="true">
          <div className="teacher-modal-card">
            <button
              className="icon-button modal-close"
              onClick={() => setSelectedClass(null)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <span className="class-mark mint">
              <GraduationCap size={17} />
            </span>
            <h2>
              {selectedClass === 'new'
                ? 'Quick action'
                : selectedClass === 'search'
                  ? 'Class search'
                  : selectedClass}
            </h2>
            <p>
              {selectedClass === 'new'
                ? 'Choose a teaching workflow from the shortcut bar.'
                : 'This orchestration view will open the existing classroom, attendance, and gradebook records without duplicating them.'}
            </p>
            <div className="modal-actions">
              <a className="teacher-primary" href="/classroom">
                Open classroom
              </a>
              <a className="teacher-ghost" href="/attendance">
                Take attendance
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
