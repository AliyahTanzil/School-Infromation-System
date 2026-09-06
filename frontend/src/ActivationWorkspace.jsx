import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listActivationRequests, decideActivationRequest } from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

function usePendingActivations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let fetching = false;
    async function refresh() {
      if (fetching) return;
      fetching = true;
      try {
        const result = await listActivationRequests();
        if (active) {
          setRequests(result);
          setError('');
        }
      } catch (reason) {
        if (active) setError(getApiErrorMessage(reason, 'Unable to load activation requests'));
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return { requests, setRequests, loading, error };
}

export function ActivationNotice() {
  const { requests, loading, error } = usePendingActivations();
  return (
    <section
      className="data-panel"
      aria-label="School activation notifications"
      style={{ marginTop: '1.5rem', border: '2px solid #2f6bff' }}
    >
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div aria-live="polite">
          <h2>School activations</h2>
          <p>
            {loading
              ? 'Checking pending activations�'
              : error
                ? 'Activation notifications are unavailable.'
                : `${requests.length} school administrator account${requests.length === 1 ? '' : 's'} awaiting activation`}
          </p>
        </div>
        <Link className="primary-button" to="/owner/activations">
          Review activations
        </Link>
      </div>
    </section>
  );
}

export default function ActivationWorkspace() {
  const { requests, setRequests, loading, error } = usePendingActivations();
  const [busy, setBusy] = useState(null);
  const [decisionError, setDecisionError] = useState('');
  const [notice, setNotice] = useState('');
  async function decide(request, decision) {
    setBusy(request.id);
    setDecisionError('');
    setNotice('');
    try {
      await decideActivationRequest(request.id, decision);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setNotice(
        `${request.email}: ${decision === 'approve' ? 'account activated' : 'request rejected'}.`
      );
    } catch (reason) {
      setDecisionError(getApiErrorMessage(reason, 'Unable to update activation request'));
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Owner approvals</span>
          <h1 className="page-header__title">School activations</h1>
          <p className="page-header__subtitle">
            Review school administrator registrations and activate approved accounts.
          </p>
        </div>
        <Link className="secondary-button" to="/admin">
          Back to administration
        </Link>
      </header>
      {notice && (
        <p role="status" className="data-panel">
          {notice}
        </p>
      )}
      {(error || decisionError) && (
        <p role="alert" className="inline-alert">
          {decisionError || error}
        </p>
      )}
      <section className="data-panel">
        <h2>Pending requests</h2>
        <p>Requests remain eligible for approval for seven days after registration.</p>
        {loading ? (
          <p>Loading activation requests�</p>
        ) : !error && requests.length === 0 ? (
          <p>No pending activation requests.</p>
        ) : null}
        <div className="result-list">
          {requests.map((request) => (
            <article key={request.id} className="result-row">
              <div>
                <h3>
                  {[request.firstName, request.lastName].filter(Boolean).join(' ') || request.email}
                </h3>
                <p>{request.email}</p>
                {request.designation && <p>{request.designation}</p>}
                <p>
                  Submitted: {new Date(request.createdAt).toLocaleDateString()} � Expires:{' '}
                  {new Date(request.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="primary-button"
                  disabled={busy !== null}
                  onClick={() => decide(request, 'approve')}
                  aria-label={`Activate ${request.email}`}
                >
                  {busy === request.id ? 'Saving�' : 'Activate account'}
                </button>
                <button
                  className="secondary-button"
                  disabled={busy !== null}
                  onClick={() => decide(request, 'reject')}
                  aria-label={`Reject ${request.email}`}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
