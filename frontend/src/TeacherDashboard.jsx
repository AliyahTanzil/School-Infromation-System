import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, BookOpen, BriefcaseBusiness, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <Link className="teacher-ghost" to="/">
        <ArrowLeft size={15} /> Back to main page
      </Link>
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
        <p>
          Classes, schedules, attendance, gradebook, and classroom activity will appear here after
          their roadmap modules are connected to persisted data.
        </p>
      </section>
    </main>
  );
}
