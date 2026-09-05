/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

function StudentSelector({ options, selected, onChange }) {
  if (!options.length) return null;
  const current = options.find((item) => item.id === selected) || options[0];
  const initials = `${current.name?.[0] || 'C'}`.toUpperCase();

  return (
    <div className="parent-student-selector">
      <div className="parent-child-avatar mint">{initials}</div>
      <label>
        <span>Viewing student</span>
        <select value={current.id} onChange={(event) => onChange(event.target.value)}>
          {options.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name} ({child.admissionNumber})
            </option>
          ))}
        </select>
      </label>
      <ChevronDown aria-hidden="true" />
    </div>
  );
}

export default function ParentClassroomWorkspace() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/parents/me');
      const data = response.data.data;
      const parsedChildren = (data.children || []).map((link) => ({
        id: link.student.id,
        name:
          `${link.student.profile?.firstName ?? ''} ${link.student.profile?.lastName ?? ''}`.trim() ||
          'Student',
        admissionNumber: link.student.admissionNumber,
        relationship: link.relationship,
        status: link.student.status,
        permissions: link.permissions,
      }));
      setChildren(parsedChildren);
      setSelectedId((current) =>
        parsedChildren.some((child) => child.id === current) ? current : parsedChildren[0]?.id || ''
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load family portal'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClassroomData = useCallback(async () => {
    try {
      const classroomsRes = await api.get('/lms/classrooms');
      const rooms = classroomsRes.data.data || [];
      setClassrooms(rooms);

      if (rooms.length > 0) {
        const assignmentRes = await api.get('/lms/assignments', {
          params: { classroomId: rooms[0].id, status: 'PUBLISHED' },
        });
        setAssignments(assignmentRes.data.data || []);
      }
    } catch {
      // Gracefully retain empty lists if student LMS endpoints require specific student scope
    }
  }, []);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  useEffect(() => {
    if (selectedId) {
      loadClassroomData();
    }
  }, [loadClassroomData, selectedId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedId) || children[0] || null,
    [children, selectedId]
  );

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
        <StudentSelector
          options={children}
          selected={selectedId}
          onChange={(id) => {
            setSelectedAssignment(null);
            setSelectedId(id);
          }}
        />
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
        </div>
        <span className="parent-last-sync">
          <CheckCircle2 aria-hidden="true" />{' '}
          {loading ? 'Loading family portal...' : 'Family portal loaded'}
        </span>
      </div>

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
      {!loading && !error && !selectedChild && <p>No linked students found.</p>}

      {activeTab === 'overview' && (
        <>
          <section className="parent-stat-grid" aria-label="Student summary">
            <article className="parent-stat mint">
              <span>Active Classrooms</span>
              <strong>{classrooms.length}</strong>
              <small>
                <TrendingUp aria-hidden="true" /> Enrolled spaces
              </small>
            </article>
            <article className="parent-stat blue">
              <span>Published Assignments</span>
              <strong>{assignments.length}</strong>
              <small>
                <CalendarDays aria-hidden="true" /> Active classwork
              </small>
            </article>
            <article className="parent-stat amber">
              <span>Learner Status</span>
              <strong>{selectedChild?.status ?? 'Not available'}</strong>
              <small>
                <AlertTriangle aria-hidden="true" /> {selectedChild?.relationship ?? 'Parent'}
              </small>
            </article>
            <article className="parent-stat violet">
              <span>Academic Access</span>
              <strong>{selectedChild?.permissions?.academic ? 'Granted' : 'Restricted'}</strong>
              <small>
                <Inbox aria-hidden="true" /> Verifiable access
              </small>
            </article>
          </section>
          <div className="parent-main-grid">
            <div className="parent-column">
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Enrolled learning spaces</span>
                    <h2>Digital Classrooms</h2>
                  </div>
                  <a className="parent-link" href="/parent-portal">
                    <UsersRound aria-hidden="true" /> Family Portal
                  </a>
                </div>
                <div className="parent-schedule">
                  {classrooms.length === 0 && (
                    <p style={{ color: '#9aabc0', fontSize: '13px' }}>
                      No active digital classrooms found for this student.
                    </p>
                  )}
                  {classrooms.map((item) => (
                    <div className="parent-schedule-item" key={item.id}>
                      <time>{item.code}</time>
                      <i className="parent-schedule-line mint" />
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item._count?.memberships ?? 0} members ·{' '}
                          {item.description || 'Active classroom'}
                        </small>
                      </div>
                      <span className="parent-badge live">ACTIVE</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Learning activity</span>
                    <h2>Assignments and classwork</h2>
                  </div>
                </div>
                <div className="parent-assignment-list">
                  {assignments.length === 0 && (
                    <p style={{ color: '#9aabc0', fontSize: '13px' }}>
                      No published assignments available.
                    </p>
                  )}
                  {assignments.map((item) => (
                    <button
                      className="parent-assignment"
                      key={item.id}
                      onClick={() => setSelectedAssignment(item)}
                    >
                      <span className="parent-work-icon mint">
                        <FileText aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.type} · {item.points} pts{' '}
                          {item.dueAt ? `· Due ${new Date(item.dueAt).toLocaleDateString()}` : ''}
                        </small>
                      </span>
                      <span className="parent-badge mint">{item.status}</span>
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
                  <strong>Not available</strong>
                  <span>overall average</span>
                </div>
                <p>Academic averages are not included in the family portal data.</p>
              </section>
              <section className="parent-panel">
                <div className="parent-section-heading">
                  <div>
                    <span className="section-kicker">Connected classroom</span>
                    <h2>Classroom directory</h2>
                  </div>
                  <button
                    className="parent-link"
                    onClick={() => notify('Teacher directory opened.')}
                  >
                    <UsersRound aria-hidden="true" /> Directory
                  </button>
                </div>
                <div className="parent-class-list">
                  {classrooms.map((item) => (
                    <button
                      className="parent-class"
                      key={item.id}
                      onClick={() => notify(`Opening ${item.name} progress.`)}
                    >
                      <span className="parent-class-mark mint">{item.code}</span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description || 'Digital classroom'}</small>
                      </span>
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
            {selectedChild
              ? `Attendance details for ${selectedChild.name} are not available in this view.`
              : 'Select a linked student to view attendance information.'}
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
            {selectedChild
              ? `Contact the school for classroom updates for ${selectedChild.name}.`
              : 'Select a linked student to view school messages.'}
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
            <span className="parent-work-icon mint">
              <BookOpen aria-hidden="true" />
            </span>
            <h2 id="parent-assignment-title">{selectedAssignment.title}</h2>
            <p>
              {selectedAssignment.type} · {selectedAssignment.points} pts
              {selectedAssignment.dueAt
                ? ` · Due ${new Date(selectedAssignment.dueAt).toLocaleDateString()}`
                : ' · No due date'}
            </p>
            {selectedAssignment.description && <p>{selectedAssignment.description}</p>}
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
