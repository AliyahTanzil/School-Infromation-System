import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  UserRound,
} from 'lucide-react';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    fetch('/api/teachers/me', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload?.error?.message ?? 'Unable to load teacher profile');
        return payload.data;
      })
      .then(setTeacher)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div>
          <p className="eyebrow">SAIS · Teacher workspace</p>
          <h1>
            {teacher
              ? `${teacher.profile.firstName} ${teacher.profile.lastName}`
              : 'Teacher profile'}
          </h1>
          <p>Your verified employment identity and lifecycle status.</p>
        </div>
      </header>
      {loading && <section className="teacher-panel">Loading teacher profile…</section>}
      {error && (
        <section className="teacher-panel" role="alert">
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
            <span>Status</span>
            <strong>{teacher.status.replaceAll('_', ' ')}</strong>
          </article>
        </section>
      )}
      <section className="teacher-panel">
        <h2>Teaching workspace</h2>
        <p>Open the tools used for daily teaching, assessment, and learner support.</p>
        <div className="teacher-action-grid">
          <a href="/classes">
            <GraduationCap size={18} />
            <span>
              <strong>My classes</strong>
              <small>Class groups and learners</small>
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
