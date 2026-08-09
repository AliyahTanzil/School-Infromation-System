import { useEffect, useState } from 'react';

const API = '/api/examinations';

export default function ExaminationsDashboard() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(API, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok)
          throw new Error((await response.json()).message || 'Unable to load examinations');
        return response.json();
      })
      .then((result) => setItems(result.data || []))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic operations</p>
          <h1>Examinations</h1>
          <p>Configure exam windows, track marking, and lock approved marks.</p>
        </div>
        <button className="primary-button" type="button">
          New examination
        </button>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
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
              Create the first examination cycle to begin scheduling candidates and recording marks.
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
