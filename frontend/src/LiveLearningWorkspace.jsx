/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Headphones,
  Info,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

function SessionRow({ session, selected, onSelect }) {
  const timeStr = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : session.time || '10:00 AM';
  const state = session.status ? session.status.toLowerCase() : session.state || 'scheduled';

  return (
    <button
      className={`live-session-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(session)}
      type="button"
    >
      <span className="live-session-time">
        <b>{timeStr}</b>
      </span>
      <span className={`live-session-line ${session.accent || 'mint'}`} />
      <span className="live-session-copy">
        <strong>{session.title}</strong>
        <small>
          {session.host
            ? `${session.host.firstName} ${session.host.lastName}`
            : session.teacher || 'Host'}{' '}
          · {session.classroom?.name || session.meta || 'Virtual Room'}
        </small>
      </span>
      <span className={`live-badge ${state}`}>
        {state === 'live' ? 'Live now' : state === 'next' ? 'Next' : 'Scheduled'}
      </span>
    </button>
  );
}

export default function LiveLearningWorkspace() {
  const [sessions, setSessions] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('sessions');
  const [joined, setJoined] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolId] = useState(() => sessionStorage.getItem('sais.schoolId') || '');

  const loadData = useCallback(async () => {
    const headers = schoolId ? { 'x-school-id': schoolId } : {};
    setLoading(true);
    setError('');
    try {
      const [sessionsRes, recordingsRes] = await Promise.allSettled([
        api.get('/lms/live-sessions', { headers }),
        api.get('/lms/live-sessions/recordings', { headers }),
      ]);

      if (sessionsRes.status === 'fulfilled') {
        const items = sessionsRes.value.data.data || [];
        setSessions(items);
        if (items.length > 0 && !selected) {
          setSelected(items[0]);
        }
      }

      if (recordingsRes.status === 'fulfilled') {
        setRecordings(recordingsRes.value.data.data || []);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load live learning data'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, selected]);

  useEffect(() => {
    sessionStorage.setItem('sais.schoolId', schoolId);
    loadData();
  }, [loadData, schoolId]);

  const filteredRecordings = useMemo(
    () =>
      recordings.filter((item) =>
        (item.recordingTitle || item.title || '').toLowerCase().includes(search.toLowerCase())
      ),
    [recordings, search]
  );

  const announce = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleJoin = (session) => {
    if (!session) return;
    setJoined(true);
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
    }
    announce(`Joined ${session.title}`);
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
            {item === 'sessions' && <b>{sessions.length}</b>}
            {item === 'recordings' && <b>{recordings.length}</b>}
          </button>
        ))}
        <button
          onClick={loadData}
          disabled={loading}
          className="live-sync"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: '#9cb2cb',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          type="button"
        >
          <RefreshCw size={13} /> {loading ? 'Loading...' : 'Synced just now'}
        </button>
      </nav>

      {error && (
        <div
          style={{
            background: '#3c181c',
            color: '#ffb3ba',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {tab === 'sessions' && (
        <>
          {selected ? (
            <section className="live-hero-card">
              <div className="live-hero-copy">
                <span className="live-now-label">
                  <span /> {selected.status === 'LIVE' ? 'Happening now' : 'Scheduled session'}
                </span>
                <h2>{selected.title}</h2>
                <p>
                  {selected.host ? `${selected.host.firstName} ${selected.host.lastName}` : 'Host'}{' '}
                  · {selected.classroom?.name || 'Digital Classroom'}
                </p>
                <div className="live-hero-meta">
                  <span>
                    <UsersRound size={14} /> {selected.classroom?.code || 'Virtual Room'}
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
                    <b>{selected.roomCode || selected.classroom?.code || 'virtual-204'}</b>
                  </span>
                </div>
                <button className="live-primary" onClick={() => handleJoin(selected)} type="button">
                  <Video size={16} /> {joined ? 'Joined classroom' : 'Join classroom'}
                </button>
                <button
                  className="live-hero-link"
                  onClick={() => setShowDetails(true)}
                  type="button"
                >
                  View session details <ChevronRight size={14} />
                </button>
              </div>
            </section>
          ) : (
            <section className="live-hero-card">
              <div className="live-hero-copy">
                <span className="live-now-label">
                  <span /> No active live sessions
                </span>
                <h2>Live Learning Sessions</h2>
                <p>
                  Scheduled live sessions and virtual classrooms will appear here when created by
                  classroom teachers.
                </p>
              </div>
            </section>
          )}

          <div className="live-main-grid">
            <section className="live-panel live-schedule-panel">
              <div className="live-section-heading">
                <div>
                  <span className="section-kicker">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
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
                {sessions.length === 0 && !loading && (
                  <p style={{ color: '#9aabc0', fontSize: '13px', padding: '12px 0' }}>
                    No live sessions found for your accessible classrooms.
                  </p>
                )}
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    selected={selected?.id === session.id}
                    onSelect={setSelected}
                  />
                ))}
              </div>
              <div className="live-schedule-footer">
                <Clock3 size={14} />
                <span>
                  <strong>
                    Classroom sessions are synchronized with live timetable schedules.
                  </strong>
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
                  <strong>100%</strong>
                  <span>active status</span>
                  <b>
                    Verified <small>student account</small>
                  </b>
                </div>
                <div className="live-progress">
                  <i />
                </div>
                <div className="live-attendance-footer">
                  <span>
                    <span className="live-dot mint" /> {sessions.length} sessions scheduled
                  </span>
                  <span>
                    <span className="live-dot blue" /> {recordings.length} recordings available
                  </span>
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
              {filteredRecordings.length === 0 && (
                <p style={{ color: '#9aabc0', fontSize: '13px', padding: '12px' }}>
                  No session recordings found.
                </p>
              )}
              {filteredRecordings.map((item) => (
                <button
                  className="live-recording-row"
                  key={item.id}
                  onClick={() => {
                    if (item.recordingUrl)
                      window.open(item.recordingUrl, '_blank', 'noopener,noreferrer');
                    announce(`Opening ${item.recordingTitle || item.title}`);
                  }}
                  type="button"
                >
                  <span className="live-recording-icon mint">
                    <PlayCircle size={18} />
                  </span>
                  <span>
                    <strong>{item.recordingTitle || item.title}</strong>
                    <small>
                      {item.classroom?.name || 'Classroom'} ·{' '}
                      {new Date(item.updatedAt).toLocaleDateString()}
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
