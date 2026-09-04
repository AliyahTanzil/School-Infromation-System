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
  const summary = [
    { label: 'Exam cycles', value: items.length },
    { label: 'Pending review', value: items.filter((item) => item.status === 'DRAFT').length },
    { label: 'Locked', value: items.filter((item) => item.status === 'LOCKED').length },
  ];

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic operations</p>
          <h1 className="page-header__title">Examinations</h1>
          <p className="page-header__subtitle">
            Configure candidate registers, subject schedules, marking, moderation, approval, and
            locking.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </header>

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {summary.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>School context</h2>
            <p>Scope records to the active school before creating or reviewing cycle data.</p>
          </div>
        </div>
        <div className="form-field" style={{ maxWidth: '26rem' }}>
          <label className="form-field__label">School ID</label>
          <input
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            placeholder="School UUID"
          />
        </div>
        {error && (
          <p className="inline-alert" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>New examination cycle</h2>
            <p>Start a draft cycle and prepare it for candidates, marks, and approval.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={create}>
          <label className="form-field">
            <span className="form-field__label">Examination name</span>
            <input
              required
              aria-label="Examination name"
              placeholder="Examination name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Unique code</span>
            <input
              required
              aria-label="Examination code"
              placeholder="Unique code"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="primary-button" disabled={!schoolId} type="submit">
              Create draft
            </button>
          </div>
        </form>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Exam cycles</h2>
            <p>Tenant and school-scoped examination workflows.</p>
          </div>
          <span className="status-chip">{items.length} total</span>
        </div>

        {loading ? (
          <p className="loading-state">Loading examinations…</p>
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
            <table className="data-table">
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
