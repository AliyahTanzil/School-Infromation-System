import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function SecurityAdminDashboard() {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadSessions() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data.data.sessions);
    } catch (err) {
      setSessions(null);
      setError(getApiErrorMessage(err, 'Unable to load your sessions.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function revoke(session) {
    setPending(session.id);
    setError('');
    setMessage('');
    try {
      await api.delete(`/auth/sessions/${encodeURIComponent(session.id)}`);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setMessage('Session revoked. That device must sign in again.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to revoke this session.'));
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="security-admin-page">
      <Link className="secondary-button" to="/admin">
        Back to administration
      </Link>
      <header className="security-admin-hero">
        <div>
          <p className="eyebrow">Account security</p>
          <h1>Security administration</h1>
          <p>Review your signed-in devices and revoke sessions you no longer use.</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <section className="security-panel" aria-labelledby="session-heading" aria-busy={loading}>
        <div className="panel-heading">
          <div>
            <h2 id="session-heading">Your active sessions</h2>
            <p>Only sessions belonging to your account are shown.</p>
          </div>
          <button disabled={loading || pending !== null} onClick={loadSessions}>
            Refresh sessions
          </button>
        </div>
        {loading ? (
          <p role="status">Loading sessions�</p>
        ) : (
          sessions && (
            <>
              <p>
                {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
              </p>
              {sessions.length === 0 && <p>No active sessions found.</p>}
              {sessions.map((session) => (
                <div className="security-row" key={session.id}>
                  <div>
                    <strong>{session.deviceName || session.deviceType || 'Unnamed device'}</strong>
                    <span>{session.current ? 'Current session' : 'Other signed-in device'}</span>
                    <span>
                      Last active:{' '}
                      {session.lastActiveAt
                        ? new Date(session.lastActiveAt).toLocaleString()
                        : 'Unavailable'}
                    </span>
                  </div>
                  {session.current ? (
                    <span>Use Sign out to end this session.</span>
                  ) : (
                    <button
                      disabled={pending !== null}
                      onClick={() => revoke(session)}
                      aria-label={`Revoke session for ${session.deviceName || session.deviceType || 'unnamed device'}`}
                    >
                      {pending === session.id ? 'Revoking�' : 'Revoke session'}
                    </button>
                  )}
                </div>
              ))}
            </>
          )
        )}
      </section>
      <section className="security-panel">
        <h2>School-wide security controls</h2>
        <p>
          MFA coverage, threat monitoring, compliance evidence and retention controls are not yet
          available here.
        </p>
        <p>A school-wide security assessment has not been completed.</p>
      </section>
    </main>
  );
}
