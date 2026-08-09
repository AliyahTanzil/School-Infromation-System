import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/students?search=${encodeURIComponent(query)}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Unable to load students'))
      )
      .then((payload) => setStudents(payload.data?.items ?? []))
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Student information</span>
          <h1>Students</h1>
          <p>Manage admissions, enrollment, guardians, and student records.</p>
        </div>
        <a className="primary-button" href="/students/new">
          Register student
        </a>
      </section>
      <section className="panel">
        <label className="search-field">
          <span className="sr-only">Search students</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or admission number"
          />
        </label>
        {loading && <p>Loading students...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && students.length === 0 && <p>No students found.</p>}
        {!loading && !error && students.length > 0 && (
          <div className="student-list">
            {students.map((student) => (
              <a className="student-row" href={`/students/${student.id}`} key={student.id}>
                <span>
                  <strong>
                    {student.profile?.firstName} {student.profile?.lastName}
                  </strong>
                  <small>{student.admissionNumber}</small>
                </span>
                <span className="status-pill">{student.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
