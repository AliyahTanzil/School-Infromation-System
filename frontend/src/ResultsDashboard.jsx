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
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic records</p>
          <h1>Result management</h1>
          <p>
            Process locked examination marks through review, approval, publication, and final
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
        <h2>Process official results</h2>
        <form className="space-y-3" onSubmit={process}>
          <input
            required
            aria-label="Examination ID"
            value={examinationId}
            onChange={(event) => setExaminationId(event.target.value)}
            placeholder="Locked examination UUID"
          />
          <input
            required
            aria-label="Grading scheme ID"
            value={schemeId}
            onChange={(event) => setSchemeId(event.target.value)}
            placeholder="Active grading policy UUID"
          />
          <button className="primary-button" disabled={!schoolId}>
            Process or recalculate
          </button>
        </form>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Results', stats?.count ?? 0],
          ['Pass count', stats?.passCount ?? 0],
          ['Average', Number(stats?.average ?? 0).toFixed(2)],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>Official results</h2>
        {results.length === 0 ? (
          <p>No processed results found.</p>
        ) : (
          results.map((item) => (
            <article className="student-row" key={item.id}>
              <span>
                <strong>{item.studentId}</strong>
                <small>
                  Total {item.total} · Average {item.average} · Grade {item.grade ?? '—'} · Position{' '}
                  {item.position ?? '—'}
                </small>
              </span>
              <span className="status-pill">{item.status}</span>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
