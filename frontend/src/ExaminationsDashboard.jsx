import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const requestHeaders = (schoolId) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'content-type': 'application/json',
  'x-school-id': schoolId,
});
export default function ExaminationsDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/examinations', { headers: requestHeaders(schoolId) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to load examinations');
      setItems(payload.data ?? []);
      sessionStorage.setItem('schoolId', schoolId);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);
  useEffect(() => {
    load();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/examinations', {
      method: 'POST',
      headers: requestHeaders(schoolId),
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload?.error?.message ?? 'Unable to create examination');
    setForm({ name: '', code: '' });
    await load();
  };
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic operations</p>
          <h1>Examinations</h1>
          <p>
            Configure candidate registers, subject schedules, marking, moderation, approval, and
            locking.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </header>
      <section className="panel">
        <label>
          School ID
          <input
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            placeholder="School UUID"
          />
        </label>
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>New examination cycle</h2>
        <form className="space-y-3" onSubmit={create}>
          <input
            required
            aria-label="Examination name"
            placeholder="Examination name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            required
            aria-label="Examination code"
            placeholder="Unique code"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <button className="primary-button" disabled={!schoolId}>
            Create draft
          </button>
        </form>
      </section>
      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <h2>Exam cycles</h2>
            <p>Tenant and school-scoped examination workflows.</p>
          </div>
          <span className="status-chip">{items.length} total</span>
        </div>
        {loading ? (
          <p>Loading examinations…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No examinations configured</h3>
            <p>
              Create the first draft, then add candidates and subject schedules through its API
              workflow.
            </p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Candidates</th>
                  <th>Schedules</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.code}</td>
                    <td>
                      <span className="status-chip">{item.status}</span>
                    </td>
                    <td>{item._count?.candidates ?? 0}</td>
                    <td>{item._count?.schedules ?? 0}</td>
                    <td>{item._count?.marks ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
