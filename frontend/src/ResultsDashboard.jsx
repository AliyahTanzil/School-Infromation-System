import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
const headers = (schoolId) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'content-type': 'application/json',
  'x-school-id': schoolId,
});
export default function ResultsDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [examinationId, setExaminationId] = useState('');
  const [schemeId, setSchemeId] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!schoolId) return;
    const suffix = examinationId ? `?examinationId=${encodeURIComponent(examinationId)}` : '';
    try {
      const [listResponse, statsResponse] = await Promise.all([
        fetch(`/api/results${suffix}`, { headers: headers(schoolId) }),
        fetch(`/api/results/statistics${suffix}`, { headers: headers(schoolId) }),
      ]);
      const [list, summary] = await Promise.all([listResponse.json(), statsResponse.json()]);
      if (!listResponse.ok) throw new Error(list?.error?.message ?? 'Unable to load results');
      setResults(list.data ?? []);
      setStats(summary.data);
      sessionStorage.setItem('schoolId', schoolId);
    } catch (reason) {
      setError(reason.message);
    }
  }, [schoolId, examinationId]);
  useEffect(() => {
    load();
  }, [load]);
  const process = async (event) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/results/process', {
      method: 'POST',
      headers: headers(schoolId),
      body: JSON.stringify({ examinationId, schemeId }),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload?.error?.message ?? 'Unable to process results');
    await load();
  };
  const summary = [
    ['Results', stats?.count ?? 0],
    ['Pass count', stats?.passCount ?? 0],
    ['Average', Number(stats?.average ?? 0).toFixed(2)],
  ];

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic records</p>
          <h1 className="page-header__title">Result management</h1>
          <p className="page-header__subtitle">
            Process locked examination marks through review, approval, publication, and final
            locking.
          </p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </header>

      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {summary.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <div className="stat-card__label">{label}</div>
            <div className="stat-card__value">{value}</div>
          </div>
        ))}
      </section>

      <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-heading">
          <div>
            <h2>School context</h2>
            <p>Confirm the active school before processing results or reading report summaries.</p>
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
            <h2>Process official results</h2>
            <p>Recalculate result sets using the approved exam and grading scheme.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={process}>
          <label className="form-field">
            <span className="form-field__label">Examination ID</span>
            <input
              required
              aria-label="Examination ID"
              value={examinationId}
              onChange={(event) => setExaminationId(event.target.value)}
              placeholder="Locked examination UUID"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Grading scheme ID</span>
            <input
              required
              aria-label="Grading scheme ID"
              value={schemeId}
              onChange={(event) => setSchemeId(event.target.value)}
              placeholder="Active grading policy UUID"
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="primary-button" disabled={!schoolId} type="submit">
              Process or recalculate
            </button>
          </div>
        </form>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <h2>Official results</h2>
            <p>Published academic outcomes and pass-rate summaries for the selected examination.</p>
          </div>
          <span className="status-chip">{results.length} records</span>
        </div>

        {results.length === 0 ? (
          <p className="empty-state">No processed results found.</p>
        ) : (
          <div className="result-list">
            {results.map((item) => (
              <article className="result-row" key={item.id}>
                <span className="result-row__meta">
                  <strong>{item.studentId}</strong>
                  <small>
                    Total {item.total} · Average {item.average} · Grade {item.grade ?? '—'} ·
                    Position {item.position ?? '—'}
                  </small>
                </span>
                <span className="status-pill">{item.status}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
