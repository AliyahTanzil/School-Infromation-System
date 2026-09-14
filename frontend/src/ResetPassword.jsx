import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function ResetPassword() {
  const [params, setParams] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const validLink = token.trim().length > 0 && token.length <= 512;

  async function submit(event) {
    event.preventDefault();
    if (busy || !validLink) return;
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPassword({ token, password });
      setPassword('');
      setConfirmation('');
      setComplete(true);
      setParams({}, { replace: true });
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to reset your password. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
        {complete ? (
          <p role="status">Your password has been reset. Sign in with your new password.</p>
        ) : !validLink ? (
          <p role="alert">This reset link is missing or invalid. Request a new link below.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">
              Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.
            </p>
            <label className="block">
              New password
              <input
                className="mt-1 w-full rounded-lg border p-3"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              Confirm new password
              <input
                className="mt-1 w-full rounded-lg border p-3"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={busy}
              />
            </label>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Resetting password…' : 'Reset password'}
            </button>
          </form>
        )}
        {!complete && (
          <Link className="block text-indigo-700 underline" to="/forgot-password">
            Request a new reset link
          </Link>
        )}
        <Link className="block text-indigo-700 underline" to="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
