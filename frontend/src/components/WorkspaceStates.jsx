/**
 * WorkspaceStates — consistent loading, empty, error, forbidden, and
 * service-unavailable UI building blocks.
 *
 * Import what you need:
 *   import { WorkspaceLoading, WorkspaceEmpty, WorkspaceError,
 *            WorkspaceForbidden, WorkspaceOffline } from './components/WorkspaceStates.jsx';
 */

/* eslint-disable react/prop-types */
import { AlertTriangle, Info, LockKeyhole, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared skeleton structure
// ─────────────────────────────────────────────────────────────────────────────

function StateShell({ children, 'aria-label': ariaLabel }) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className="flex min-h-[16rem] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-12 text-center"
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading state
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceLoading({ message = 'Loading…' }) {
  return (
    <StateShell aria-label="Loading workspace">
      <div
        role="progressbar"
        aria-label={message}
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400"
      />
      <p className="text-sm text-slate-400">{message}</p>
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceEmpty({ title = 'Nothing here yet', message, action }) {
  return (
    <StateShell aria-label="Empty workspace">
      <Info size={32} className="text-slate-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-200">{title}</p>
        {message && <p className="mt-1 text-sm text-slate-400">{message}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          {action.label}
        </button>
      )}
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error state (general / network / server 5xx)
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceError({ message = 'Something went wrong.', onRetry }) {
  return (
    <StateShell aria-label="Workspace error">
      <AlertTriangle size={32} className="text-amber-400" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-200">Unable to load</p>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Try again
        </button>
      )}
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Forbidden state (403)
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceForbidden({ message = "You don't have permission to view this page." }) {
  return (
    <StateShell aria-label="Access forbidden">
      <LockKeyhole size={32} className="text-rose-400" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-200">Access denied</p>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
      </div>
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offline state (network failure / no connection)
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceOffline({ onRetry }) {
  return (
    <StateShell aria-label="No network connection">
      <WifiOff size={32} className="text-slate-400" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-200">You appear to be offline</p>
        <p className="mt-1 text-sm text-slate-400">Check your internet connection and try again.</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </button>
      )}
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service unavailable (503 / feature not yet available)
// ─────────────────────────────────────────────────────────────────────────────

export function WorkspaceUnavailable({
  message = 'This feature is temporarily unavailable. Please try again later.',
}) {
  return (
    <StateShell aria-label="Service unavailable">
      <ServerCrash size={32} className="text-slate-400" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-200">Service unavailable</p>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
      </div>
    </StateShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart resolver: picks the right state based on an Axios error response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the appropriate workspace state component from an Axios error.
 *
 * Usage:
 *   const State = resolveErrorState(err);
 *   if (State) return <State onRetry={load} />;
 */
export function resolveErrorState(error) {
  if (!error) return null;

  // Network error (no response at all)
  if (!error.response) {
    if (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.toLowerCase().includes('network')
    ) {
      return WorkspaceOffline;
    }
    return WorkspaceError;
  }

  const status = error.response.status;
  if (status === 403) return WorkspaceForbidden;
  if (status === 503 || status === 501) return WorkspaceUnavailable;
  return WorkspaceError;
}
