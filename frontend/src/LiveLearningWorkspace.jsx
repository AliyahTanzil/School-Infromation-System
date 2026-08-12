/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Headphones,
  Info,
  Link2,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
  X,
} from 'lucide-react';

const sessions = [
  {
    id: 'biology',
    time: '10:00',
    period: 'AM',
    title: 'Biology Lab: Cell Division',
    teacher: 'Dr. Maya Patel',
    meta: 'Grade 10 Biology · Room virtual-204',
    state: 'live',
    count: 24,
    accent: 'mint',
  },
  {
    id: 'history',
    time: '11:30',
    period: 'AM',
    title: 'Modern History Seminar',
    teacher: 'Mr. Daniel Okafor',
    meta: 'Grade 10 History · Room virtual-118',
    state: 'next',
    count: 18,
    accent: 'violet',
  },
  {
    id: 'office',
    time: '2:00',
    period: 'PM',
    title: 'Office hours and review',
    teacher: 'Ms. Elena Rossi',
    meta: 'Open study room · Drop-in access',
    state: 'scheduled',
    count: 8,
    accent: 'blue',
  },
];

const recordingItems = [
  ['Photosynthesis: light reactions', 'Biology · 42 min', 'Yesterday', 'mint'],
  ['Algebra II exam review', 'Mathematics · 55 min', 'Monday', 'violet'],
  ['Writing a historical argument', 'History · 31 min', 'Monday', 'blue'],
];

function SessionRow({ session, selected, onSelect }) {
  return (
    <button
      className={`live-session-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(session)}
      type="button"
    >
      <span className="live-session-time">
        <b>{session.time}</b>
        <small>{session.period}</small>
      </span>
      <span className={`live-session-line ${session.accent}`} />
      <span className="live-session-copy">
        <strong>{session.title}</strong>
        <small>
          {session.teacher} · {session.count} enrolled
        </small>
      </span>
      <span className={`live-badge ${session.state}`}>
        {session.state === 'live' ? 'Live now' : session.state === 'next' ? 'Next' : 'Scheduled'}
      </span>
    </button>
  );
}

export default function LiveLearningWorkspace() {
  const [selected, setSelected] = useState(sessions[0]);
  const [tab, setTab] = useState('sessions');
  const [joined, setJoined] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  const filteredRecordings = useMemo(
    () => recordingItems.filter((item) => item[0].toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const announce = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  return (
    <main className="live-learning-shell">
      <header className="live-learning-header">
        <div>
          <p className="eyebrow">Live learning · academic year 2025–26</p>
          <h1>Classes, in the room.</h1>
          <p>
            Join live lessons, review recordings, and stay connected to every classroom without
            losing the structure of your school day.
          </p>
        </div>
        <div className="live-header-actions">
          <span className="live-privacy">
            <LockKeyhole size={13} /> School-managed sessions
          </span>
          <button
            className="live-ghost"
            onClick={() => announce('Help center opened')}
            type="button"
          >
            <Info size={14} /> Help center
          </button>
          <button
            className="live-icon-button"
            onClick={() => announce('No new live-learning alerts')}
            type="button"
          >
            <MessageCircle size={16} />
            <i />
          </button>
        </div>
      </header>

      <nav className="live-tabs" aria-label="Live learning sections">
        {['sessions', 'recordings', 'materials'].map((item) => (
          <button
            className={tab === item ? 'active' : ''}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {item[0].toUpperCase() + item.slice(1)}
            {item === 'sessions' && <b>3</b>}
          </button>
        ))}
        <span className="live-sync">
          <Check size={13} /> Synced just now
        </span>
      </nav>

      {tab === 'sessions' && (
        <>
          <section className="live-hero-card">
            <div className="live-hero-copy">
              <span className="live-now-label">
                <span /> Happening now
              </span>
              <h2>{selected.title}</h2>
              <p>
                {selected.teacher} · {selected.meta}
              </p>
              <div className="live-hero-meta">
                <span>
                  <UsersRound size={14} /> {selected.count} students
                </span>
                <span>
                  <Headphones size={14} /> Captions enabled
                </span>
                <span>
                  <ShieldCheck size={14} /> School account verified
                </span>
              </div>
            </div>
            <div className="live-hero-actions">
              <div className="live-preview">
                <Radio size={22} />
                <span>
                  Classroom
                  <br />
                  <b>virtual-{selected.id === 'biology' ? '204' : '118'}</b>
                </span>
              </div>
              <button
                className="live-primary"
                onClick={() => {
                  setJoined(true);
                  announce(`Joined ${selected.title}`);
                }}
                type="button"
              >
                <Video size={16} /> {joined ? 'Joined classroom' : 'Join classroom'}
              </button>
              <button className="live-hero-link" onClick={() => setShowDetails(true)} type="button">
                View session details <ChevronRight size={14} />
              </button>
            </div>
          </section>

          <div className="live-main-grid">
            <section className="live-panel live-schedule-panel">
              <div className="live-section-heading">
                <div>
                  <span className="section-kicker">Tuesday, September 16</span>
                  <h2>Today&apos;s classrooms</h2>
                </div>
                <button
                  className="live-link"
                  onClick={() => announce('Calendar opened')}
                  type="button"
                >
                  <CalendarDays size={14} /> View calendar
                </button>
              </div>
              <div className="live-session-list">
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    selected={selected.id === session.id}
                    onSelect={setSelected}
                  />
                ))}
              </div>
              <div className="live-schedule-footer">
                <Clock3 size={14} />
                <span>
                  <strong>Next class starts in 28 minutes</strong>
                  <small>Allow microphone and camera access before joining.</small>
                </span>
              </div>
            </section>
            <div className="live-column">
              <section className="live-panel live-attendance-card">
                <div className="live-section-heading">
                  <div>
                    <span className="section-kicker">This week</span>
                    <h2>Participation</h2>
                  </div>
                  <Sparkles size={18} className="live-spark" />
                </div>
                <div className="live-participation">
                  <strong>96%</strong>
                  <span>attendance rate</span>
                  <b>
                    +4.2% <small>vs last month</small>
                  </b>
                </div>
                <div className="live-progress">
                  <i />
                </div>
                <div className="live-attendance-footer">
                  <span>
                    <span className="live-dot mint" /> 8 of 8 attended
                  </span>
                  <span>
                    <span className="live-dot blue" /> 2 recordings watched
                  </span>
                </div>
              </section>
              <section className="live-panel live-upcoming-card">
                <div className="live-section-heading">
                  <div>
                    <span className="section-kicker">Classroom queue</span>
                    <h2>Up next</h2>
                  </div>
                  <button
                    className="live-link"
                    onClick={() => announce('Schedule opened')}
                    type="button"
                  >
                    See all
                  </button>
                </div>
                <div className="live-upcoming">
                  <div className="live-upcoming-icon violet">
                    <FileText size={16} />
                  </div>
                  <span>
                    <strong>Algebra II review clinic</strong>
                    <small>Tomorrow · 9:00 AM · 48 students</small>
                  </span>
                  <ChevronRight size={15} />
                </div>
                <div className="live-upcoming">
                  <div className="live-upcoming-icon blue">
                    <Link2 size={16} />
                  </div>
                  <span>
                    <strong>Study group: exam prep</strong>
                    <small>Tomorrow · 3:30 PM · Optional</small>
                  </span>
                  <ChevronRight size={15} />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {tab === 'recordings' && (
        <section className="live-recordings-layout">
          <div className="live-panel">
            <div className="live-section-heading">
              <div>
                <span className="section-kicker">On demand</span>
                <h2>Recent recordings</h2>
              </div>
              <div className="live-search">
                <Search size={14} />
                <input
                  aria-label="Search recordings"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search recordings"
                />
              </div>
            </div>
            <div className="live-recording-list">
              {filteredRecordings.map((item) => (
                <button
                  className="live-recording-row"
                  key={item[0]}
                  onClick={() => announce(`Opening ${item[0]}`)}
                  type="button"
                >
                  <span className={`live-recording-icon ${item[3]}`}>
                    <PlayCircle size={18} />
                  </span>
                  <span>
                    <strong>{item[0]}</strong>
                    <small>
                      {item[1]} · {item[2]}
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </div>
          <aside className="live-recordings-note">
            <Video size={22} />
            <h2>Learn at your pace</h2>
            <p>
              Recordings are available after teachers publish them. Your watch history stays private
              to your account.
            </p>
            <span>
              <ShieldCheck size={14} /> Access follows classroom enrollment
            </span>
          </aside>
        </section>
      )}
      {tab === 'materials' && (
        <section className="live-empty-panel">
          <FileText size={30} />
          <span className="section-kicker">Classroom materials</span>
          <h2>Resources arrive with each session.</h2>
          <p>
            Open a live class or recording to see teacher-published slides, links, transcripts, and
            follow-up activities.
          </p>
          <button className="live-primary" onClick={() => setTab('sessions')} type="button">
            Back to sessions
          </button>
        </section>
      )}

      <footer className="live-footer">
        <span>
          <ShieldCheck size={13} /> Sessions are monitored by SAIS safety controls
        </span>
        <span>Need technical help? Contact your school administrator.</span>
      </footer>
      {showDetails && (
        <div className="live-modal" role="dialog" aria-modal="true">
          <div className="live-modal-card">
            <button
              className="live-modal-close"
              onClick={() => setShowDetails(false)}
              type="button"
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <span className="section-kicker">Session details</span>
            <h2>{selected.title}</h2>
            <p>
              {selected.teacher} has enabled captions and recording for this session. Joining will
              open the school-managed classroom in a new secure window.
            </p>
            <div className="live-detail-list">
              <span>
                <CalendarDays size={15} /> Tuesday, September 16 · {selected.time} {selected.period}
              </span>
              <span>
                <UsersRound size={15} /> Enrolled participants only
              </span>
              <span>
                <LockKeyhole size={15} /> Camera and microphone permissions are optional
              </span>
            </div>
            <button
              className="live-primary"
              onClick={() => {
                setShowDetails(false);
                setJoined(true);
                announce(`Joined ${selected.title}`);
              }}
              type="button"
            >
              <Video size={16} /> Join secure classroom
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="live-toast" role="status">
          <Check size={15} /> {toast}
        </div>
      )}
    </main>
  );
}
