import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import { useSchoolContext } from './hooks/useSchoolContext.js';
import {
  WorkspaceLoading,
  WorkspaceEmpty,
  WorkspaceError,
  WorkspaceOffline,
} from './components/WorkspaceStates.jsx';

export default function ResultsDashboard() {
  const { schoolId } = useSchoolContext();
  const [examinationId, setExaminationId] = useState('');
  const [schemeId, setSchemeId] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = examinationId ? { examinationId } : {};
      const [listRes, statsRes] = await Promise.allSettled([
        api.get('/results', { params }),
        api.get('/results/statistics', { params }),
      ]);
      if (listRes.status === 'fulfilled') {
        setResults(listRes.value.data.data ?? []);
      } else {
        setError(listRes.reason);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [examinationId]);

  useEffect(() => {
    load();
  }, [load]);

  const process = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      await api.post('/results/process', { examinationId, schemeId });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setProcessing(false);
    }
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

      {error && (
        <section className="data-panel" style={{ marginBottom: '1.5rem' }}>
          {error.response ? (
            <WorkspaceError
              message={getApiErrorMessage(error, 'Unable to load results')}
              onRetry={load}
            />
          ) : (
            <WorkspaceOffline onRetry={load} />
          )}
        </section>
      )}

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
            <button className="primary-button" disabled={processing || !schoolId} type="submit">
              {processing ? 'Processing…' : 'Process or recalculate'}
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

        {loading ? (
          <WorkspaceLoading message="Loading results…" />
        ) : results.length === 0 ? (
          <WorkspaceEmpty
            title="No processed results found"
            message="Enter an examination ID above and process or load results."
          />
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
