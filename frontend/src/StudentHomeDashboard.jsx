/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
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
import api from './api/auth.js';
import { useAuth } from './context/AuthContext.jsx';
import { getApiErrorMessage } from './api/errorMessage.js';

function ShieldCheckIcon() {
  return <Sparkles size={14} />;
}

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolId] = useState(() => sessionStorage.getItem('sais.schoolId') || '');

  const loadData = useCallback(async () => {
    const headers = schoolId ? { 'x-school-id': schoolId } : {};
    setLoading(true);
    setError('');
    try {
      const [classroomsRes, notificationsRes] = await Promise.allSettled([
        api.get('/lms/classrooms', { headers }),
        api.get('/communication/unread-count', { headers }),
      ]);

      if (notificationsRes.status === 'fulfilled') {
        setUnreadCount(notificationsRes.value.data.data?.unreadCount ?? 0);
      }

      if (classroomsRes.status === 'fulfilled') {
        const rooms = classroomsRes.value.data.data || [];
        setClassrooms(rooms);

        if (rooms.length > 0) {
          const primaryRoomId = rooms[0].id;
          const calendarStart = new Date();
          const calendarEnd = new Date();
          calendarEnd.setDate(calendarEnd.getDate() + 30);

          const [assignmentRes, calendarRes] = await Promise.allSettled([
            api.get('/lms/assignments', {
              headers,
              params: { classroomId: primaryRoomId, status: 'PUBLISHED' },
            }),
            api.get('/lms/calendar', {
              headers,
              params: {
                classroomId: primaryRoomId,
                start: calendarStart.toISOString(),
                end: calendarEnd.toISOString(),
              },
            }),
          ]);

          if (assignmentRes.status === 'fulfilled') {
            setAssignments(assignmentRes.value.data.data || []);
          }
          if (calendarRes.status === 'fulfilled') {
            setCalendarEvents(calendarRes.value.data.data || []);
          }
        }
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load student learning data'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    sessionStorage.setItem('sais.schoolId', schoolId);
    loadData();
  }, [loadData, schoolId]);

  const initials = useMemo(() => {
    if (!user) return 'ST';
    const first = user.firstName?.[0] || 'S';
    const last = user.lastName?.[0] || 'T';
    return `${first}${last}`.toUpperCase();
  }, [user]);

  const filteredClasses = useMemo(
    () =>
      classrooms.filter((item) =>
        `${item.name} ${item.code} ${item.description || ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [classrooms, query]
  );

  return (
    <main className="student-home-shell">
      {loading && <p role="status">Loading your learning dashboard...</p>}
      <header className="student-home-header">
        <div className="student-identity">
          <div className="student-avatar">{initials}</div>
          <div>
            <span className="eyebrow">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <h1>Good morning, {user?.firstName ?? 'Student'}.</h1>
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
            {unreadCount > 0 && <i />}
          </button>
          <a className="student-primary" href="/student-submission-center">
            <BookOpen /> My work
          </a>
        </div>
      </header>
      <nav className="student-tabs" aria-label="Student dashboard sections">
        {['Overview', 'My classes', 'Progress'].map((tab) => (
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
              <span>Enrolled classrooms</span>
              <strong>{classrooms.length}</strong>
              <small>
                <CheckCircle2 /> Active learner spaces
              </small>
            </article>
            <article className="mint">
              <span>Published work</span>
              <strong>{assignments.length}</strong>
              <small>
                <TrendingUp /> Active assignments
              </small>
            </article>
            <article className="violet">
              <span>Calendar events</span>
              <strong>{calendarEvents.length}</strong>
              <small>
                <Clock3 /> Upcoming deadlines & lessons
              </small>
            </article>
            <article className="amber">
              <span>Unread updates</span>
              <strong>{unreadCount}</strong>
              <small>
                <Inbox /> From your teachers
              </small>
            </article>
          </section>
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
          <section className="student-main-grid">
            <div className="student-column">
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Upcoming events"
                  title="Your schedule"
                  action={
                    <a className="student-link" href="/classroom">
                      Open classroom <ChevronRight />
                    </a>
                  }
                />
                <div className="student-schedule">
                  {calendarEvents.length === 0 && (
                    <p style={{ color: '#9aabc0', fontSize: '13px' }}>
                      No upcoming calendar events scheduled.
                    </p>
                  )}
                  {calendarEvents.map((item) => (
                    <div
                      className={`student-schedule-item ${item.type === 'ASSIGNMENT_DUE' ? 'now' : ''}`}
                      key={item.id}
                    >
                      <span className="student-time">
                        <Clock3 />{' '}
                        {new Date(item.startsAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      <span
                        className={`student-schedule-line ${item.type === 'ASSIGNMENT_DUE' ? 'amber' : 'mint'}`}
                      />
                      <div className="student-schedule-copy">
                        <strong>{item.title}</strong>
                        <small>
                          <MapPin />{' '}
                          {item.type === 'ASSIGNMENT_DUE'
                            ? 'Assignment Deadline'
                            : item.type === 'LESSON'
                              ? 'Scheduled Lesson'
                              : 'Classroom Event'}
                        </small>
                      </div>
                      <Badge tone={item.type === 'ASSIGNMENT_DUE' ? 'amber' : 'mint'}>
                        {item.type === 'ASSIGNMENT_DUE' ? 'DUE' : 'LESSON'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Stay on track"
                  title="Upcoming work"
                  action={
                    <a className="student-link" href="/student-submission-center">
                      View all work <ChevronRight />
                    </a>
                  }
                />
                <div className="student-work-list">
                  {assignments.length === 0 && (
                    <p style={{ color: '#9aabc0', fontSize: '13px' }}>
                      No published assignments found.
                    </p>
                  )}
                  {assignments.map((item) => (
                    <a
                      className="student-work-item"
                      href="/student-submission-center"
                      key={item.id}
                    >
                      <span className="student-work-icon mint">
                        {item.type === 'PROJECT' ? (
                          <Target />
                        ) : item.type === 'LESSON' ? (
                          <FileText />
                        ) : (
                          <BookOpen />
                        )}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.points} pts{' '}
                          {item.dueAt ? `· Due ${new Date(item.dueAt).toLocaleDateString()}` : ''}
                        </small>
                      </span>
                      <MoreHorizontal />
                    </a>
                  ))}
                </div>
              </section>
            </div>
            <div className="student-column">
              <section className="student-panel">
                <SectionHeader
                  eyebrow="Enrolled this term"
                  title="My classes"
                  action={
                    <a className="student-panel-link" href="/classroom">
                      Classrooms <ChevronRight />
                    </a>
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
                  {filteredClasses.length === 0 && (
                    <p style={{ color: '#9aabc0', fontSize: '13px' }}>
                      No classrooms match your query.
                    </p>
                  )}
                  {filteredClasses.map((item) => (
                    <a className="student-class" href="/student-submission-center" key={item.id}>
                      <span className="class-mark mint">{item.code}</span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item._count?.memberships ?? 0} members</small>
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
            You have {classrooms.length} active digital classroom
            {classrooms.length === 1 ? '' : 's'}. You can inspect assignments and submit work
            directly from your Submission Center.
          </p>
          <a className="student-primary" href="/student-submission-center">
            Open Submission Center
          </a>
        </section>
      )}
      <footer className="student-footer">
        <span>
          <ShieldCheckIcon /> Your student dashboard is connected to live LMS data.
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
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} from your teachers and classroom events.`
                : 'You have no unread notifications right now.'}
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
