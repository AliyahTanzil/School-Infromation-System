import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  Users,
  UserRound,
} from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teacherRes, classroomsRes] = await Promise.allSettled([
        api.get('/teachers/me'),
        api.get('/lms/classrooms'),
      ]);

      if (teacherRes.status === 'fulfilled') {
        setTeacher(teacherRes.value.data.data);
      } else {
        setError(getApiErrorMessage(teacherRes.reason, 'Unable to load teacher profile'));
      }

      if (classroomsRes.status === 'fulfilled') {
        const rooms = classroomsRes.value.data.data || [];
        setClassrooms(rooms);

        if (rooms.length > 0) {
          const assignmentRequests = rooms.slice(0, 3).map((room) =>
            api.get('/lms/assignments', {
              params: { classroomId: room.id },
            })
          );
          const assignmentResults = await Promise.allSettled(assignmentRequests);
          const allAssignments = assignmentResults
            .filter((res) => res.status === 'fulfilled')
            .flatMap((res) => res.value.data.data || []);
          setAssignments(allAssignments);
        }
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load teacher workspace'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div>
          <p className="eyebrow">SAIS · Teacher workspace</p>
          <h1>
            {teacher
              ? `${teacher.profile?.firstName ?? ''} ${teacher.profile?.lastName ?? ''}`.trim() ||
                'Teacher profile'
              : 'Teacher profile'}
          </h1>
          <p>Your verified employment identity, assigned learning spaces, and active classwork.</p>
        </div>
        <button
          className="secondary-button"
          onClick={loadDashboard}
          disabled={loading}
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {error && (
        <section className="teacher-panel" role="alert" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={18} /> {error}
        </section>
      )}

      {teacher && (
        <section className="teacher-stats">
          <article className="teacher-panel">
            <UserRound size={18} />
            <span>Employee number</span>
            <strong>{teacher.employeeNumber}</strong>
          </article>
          <article className="teacher-panel">
            <BriefcaseBusiness size={18} />
            <span>Employment</span>
            <strong>{teacher.employment?.jobTitle ?? 'Not recorded'}</strong>
          </article>
          <article className="teacher-panel">
            <BookOpen size={18} />
            <span>Active learning spaces</span>
            <strong>
              {classrooms.length} classroom{classrooms.length === 1 ? '' : 's'}
            </strong>
          </article>
        </section>
      )}

      <section className="teacher-panel" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2>Digital Classrooms</h2>
            <p>Your assigned learning spaces and member counts.</p>
          </div>
          <a
            className="primary-button"
            href="/classroom"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 12px',
            }}
          >
            <Plus size={15} /> Open classroom workspace
          </a>
        </div>

        {loading && <p className="loading-state">Loading classrooms...</p>}
        {!loading && classrooms.length === 0 && (
          <p className="empty-state">
            No digital classrooms found for your account. Create or join a classroom to manage
            classwork.
          </p>
        )}
        {!loading && classrooms.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {classrooms.map((room) => (
              <div
                key={room.id}
                style={{
                  border: '1px solid #274663',
                  borderRadius: '12px',
                  background: '#0d1b2e',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <strong style={{ fontSize: '16px', color: '#e8eef7' }}>{room.name}</strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#48d8c9',
                        background: '#12383c',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {room.code}
                    </span>
                  </div>
                  {room.description && (
                    <p style={{ fontSize: '13px', color: '#9aabc0', margin: '6px 0 0' }}>
                      {room.description}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #1f374e',
                    paddingTop: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#9aabc0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Users size={14} /> {room._count?.memberships ?? 0} members
                  </span>
                  <a
                    href="/classroom"
                    style={{
                      color: '#48d8c9',
                      fontSize: '13px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {assignments.length > 0 && (
        <section className="teacher-panel" style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div>
              <h2>Classwork & Assignments</h2>
              <p>Recent assignments across your digital classrooms.</p>
            </div>
            <a
              href="/gradebook"
              style={{
                color: '#48d8c9',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Gradebook <ChevronRight size={14} />
            </a>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {assignments.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #274663',
                  borderRadius: '8px',
                  background: '#0b1b2e',
                  padding: '12px 16px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ color: '#edf5ff', display: 'block' }}>{item.title}</strong>
                  <span style={{ fontSize: '12px', color: '#9cb2cb' }}>
                    {item.type} · {item.points} pts{' '}
                    {item.dueAt ? `· Due ${new Date(item.dueAt).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: item.status === 'PUBLISHED' ? '#12383c' : '#28445f',
                    color: item.status === 'PUBLISHED' ? '#21c4c9' : '#bdd2e9',
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="teacher-panel">
        <h2>Teaching workspace</h2>
        <p>Open the tools used for daily teaching, assessment, and learner support.</p>
        <div className="teacher-action-grid">
          <a href="/classroom">
            <GraduationCap size={18} />
            <span>
              <strong>Digital Classrooms</strong>
              <small>Classrooms, streams, and classwork</small>
            </span>
          </a>
          <a href="/student-submission-center">
            <FileText size={18} />
            <span>
              <strong>Submissions & Work</strong>
              <small>Review student versioned submissions</small>
            </span>
          </a>
          <a href="/timetables">
            <CalendarDays size={18} />
            <span>
              <strong>Timetable</strong>
              <small>Lessons and schedules</small>
            </span>
          </a>
          <a href="/attendance">
            <ClipboardCheck size={18} />
            <span>
              <strong>Attendance</strong>
              <small>Open and mark registers</small>
            </span>
          </a>
          <a href="/gradebook">
            <BookOpen size={18} />
            <span>
              <strong>Gradebook</strong>
              <small>Marks, rubrics, and feedback</small>
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
