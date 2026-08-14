import { useMemo, useState } from 'react';
/* eslint-disable react/prop-types */
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';

const events = [
  {
    id: 1,
    day: 10,
    month: 'Jun',
    time: '08:00',
    title: 'Mathematics · Grade 10A',
    type: 'Lesson',
    color: 'mint',
    location: 'Room 204',
    owner: 'Ms. Mensah',
    duration: '45 min',
  },
  {
    id: 2,
    day: 10,
    month: 'Jun',
    time: '11:30',
    title: 'Physics lab report due',
    type: 'Deadline',
    color: 'amber',
    location: 'Online submission',
    owner: 'Grade 11B',
    duration: 'All day',
  },
  {
    id: 3,
    day: 11,
    month: 'Jun',
    time: '09:00',
    title: 'Midterm · English Language',
    type: 'Exam',
    color: 'violet',
    location: 'Exam Hall',
    owner: 'Academic office',
    duration: '90 min',
  },
  {
    id: 4,
    day: 12,
    month: 'Jun',
    time: '13:00',
    title: 'Parent-teacher conference',
    type: 'Meeting',
    color: 'blue',
    location: 'Conference room',
    owner: 'Mr. Okafor',
    duration: '30 min',
  },
  {
    id: 5,
    day: 13,
    month: 'Jun',
    time: '10:00',
    title: 'Inter-house athletics',
    type: 'School event',
    color: 'pink',
    location: 'Main field',
    owner: 'Student life',
    duration: '3 hours',
  },
  {
    id: 6,
    day: 14,
    month: 'Jun',
    time: '08:00',
    title: 'Chemistry · Grade 12',
    type: 'Lesson',
    color: 'mint',
    location: 'Science lab',
    owner: 'Dr. Boateng',
    duration: '45 min',
  },
];
const days = [10, 11, 12, 13, 14, 15, 16];
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Badge({ children, tone = '' }) {
  return <span className={`calendar-badge ${tone}`}>{children}</span>;
}

export default function CalendarWorkspace() {
  const [view, setView] = useState('Week');
  const [activeDay, setActiveDay] = useState(10);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(events[0]);
  const [showComposer, setShowComposer] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const matchesQuery = `${event.title} ${event.type} ${event.owner}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (filter === 'All' || event.type === filter);
      }),
    [query, filter]
  );

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };
  const eventFor = (day, hour) =>
    filtered.find((event) => event.day === day && event.time.startsWith(hour));

  return (
    <main className="calendar-shell">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Academic operations · 2025/26</p>
          <h1>School calendar</h1>
          <p>One source of truth for lessons, assessments, deadlines, meetings, and school life.</p>
        </div>
        <div className="calendar-header-actions">
          <button className="calendar-ghost" onClick={() => showToast('Calendar link copied')}>
            <Bell size={15} /> Reminders
          </button>
          <button className="calendar-primary" onClick={() => setShowComposer(true)}>
            <Plus size={15} /> Add event
          </button>
        </div>
      </header>

      <section className="calendar-toolbar">
        <div className="calendar-month-nav">
          <button aria-label="Previous month">
            <ChevronLeft size={17} />
          </button>
          <strong>June 2025</strong>
          <button aria-label="Next month">
            <ChevronRight size={17} />
          </button>
          <button className="today-button" onClick={() => setActiveDay(10)}>
            Today
          </button>
        </div>
        <div className="calendar-controls">
          <label className="calendar-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search calendar"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter events"
          >
            <option>All</option>
            <option>Lesson</option>
            <option>Exam</option>
            <option>Deadline</option>
            <option>Meeting</option>
            <option>School event</option>
          </select>
          <div className="calendar-view-toggle">
            {['Agenda', 'Day', 'Week', 'Month'].map((item) => (
              <button
                key={item}
                className={view === item ? 'active' : ''}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="calendar-layout">
        <div className="calendar-board">
          <div className="calendar-week-head">
            <div className="timezone-label">GMT+0 · Accra</div>
            {days.map((day, index) => (
              <button
                key={day}
                className={activeDay === day ? 'calendar-day active' : 'calendar-day'}
                onClick={() => setActiveDay(day)}
              >
                <small>{dayNames[index]}</small>
                <strong>{day}</strong>
              </button>
            ))}
          </div>
          <div className="calendar-grid">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map((hour) => (
              <div className="calendar-row" key={hour}>
                <span className="calendar-time">{hour}</span>
                {days.map((day) => {
                  const event = eventFor(day, hour);
                  return (
                    <div className="calendar-cell" key={`${day}-${hour}`}>
                      {event && (
                        <button
                          className={`calendar-event ${event.color}`}
                          onClick={() => setSelected(event)}
                        >
                          <strong>{event.title}</strong>
                          <small>
                            {event.type} · {event.duration}
                          </small>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="calendar-board-footer">
            <span>
              <i className="dot mint" />
              Teaching
            </span>
            <span>
              <i className="dot violet" />
              Assessment
            </span>
            <span>
              <i className="dot amber" />
              Deadline
            </span>
            <span>
              <i className="dot blue" />
              Community
            </span>
            <span className="calendar-sync">
              <Sparkles size={13} /> Synced 2 min ago
            </span>
          </div>
        </div>

        <aside className="calendar-side">
          {selected ? (
            <div className="event-detail">
              <div className="detail-top">
                <Badge tone={selected.color}>{selected.type}</Badge>
                <button onClick={() => setSelected(null)} aria-label="Close event detail">
                  <X size={15} />
                </button>
              </div>
              <h2>{selected.title}</h2>
              <div className="detail-info">
                <span>
                  <Clock3 size={15} /> Wed, 10 June · {selected.time} · {selected.duration}
                </span>
                <span>
                  <MapPin size={15} /> {selected.location}
                </span>
                <span>
                  <UsersRound size={15} /> {selected.owner}
                </span>
              </div>
              <div className="detail-note">
                <ShieldCheck size={15} />
                <span>
                  <strong>Visible to Grade 10A</strong>
                  <small>Academic staff and enrolled students can view this event.</small>
                </span>
              </div>
              <div className="detail-actions">
                <button className="calendar-primary" onClick={() => showToast('Event updated')}>
                  Edit event
                </button>
                <button className="calendar-ghost" onClick={() => showToast('Reminder set')}>
                  Set reminder
                </button>
              </div>
            </div>
          ) : (
            <div className="event-detail empty">
              <CalendarDays size={28} />
              <h2>Select an event</h2>
              <p>Choose a calendar item to view its details and visibility.</p>
            </div>
          )}
          <div className="upcoming-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Next up</p>
                <h2>Upcoming</h2>
              </div>
              <button onClick={() => setView('Agenda')}>View all</button>
            </div>
            {filtered.slice(0, 4).map((event) => (
              <button
                className="upcoming-item"
                key={event.id}
                onClick={() => {
                  setSelected(event);
                  setActiveDay(event.day);
                }}
              >
                <span className={`upcoming-date ${event.color}`}>
                  <strong>{event.day}</strong>
                  <small>{event.month}</small>
                </span>
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    {event.time} · {event.location}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </section>

      {showComposer && (
        <div
          className="calendar-modal-backdrop"
          role="presentation"
          onClick={() => setShowComposer(false)}
        >
          <section
            className="calendar-composer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-composer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-heading">
              <div>
                <p className="eyebrow">New calendar item</p>
                <h2 id="calendar-composer-title">Add event</h2>
              </div>
              <button onClick={() => setShowComposer(false)} aria-label="Close dialog">
                <X size={17} />
              </button>
            </div>
            <label>
              Event title
              <input placeholder="e.g. Department meeting" />
            </label>
            <div className="composer-grid">
              <label>
                Date
                <input type="date" defaultValue="2025-06-10" />
              </label>
              <label>
                Time
                <input type="time" defaultValue="09:00" />
              </label>
            </div>
            <label>
              Event type
              <select defaultValue="Meeting">
                <option>Lesson</option>
                <option>Exam</option>
                <option>Deadline</option>
                <option>Meeting</option>
                <option>School event</option>
              </select>
            </label>
            <label>
              Visibility
              <select defaultValue="Staff only">
                <option>Staff only</option>
                <option>Class or group</option>
                <option>Whole school</option>
              </select>
            </label>
            <div className="detail-actions">
              <button className="calendar-ghost" onClick={() => setShowComposer(false)}>
                Cancel
              </button>
              <button
                className="calendar-primary"
                onClick={() => {
                  setShowComposer(false);
                  showToast('Event saved as draft');
                }}
              >
                Save draft
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="calendar-toast">{toast}</div>}
    </main>
  );
}
