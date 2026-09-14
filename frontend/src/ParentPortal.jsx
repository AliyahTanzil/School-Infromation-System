import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import {
  WorkspaceLoading,
  WorkspaceEmpty,
  WorkspaceError,
  WorkspaceForbidden,
  WorkspaceOffline,
} from './components/WorkspaceStates.jsx';

export default function ParentPortal() {
  const { user } = useAuth();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPortal = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/parents/me', { signal });
      setPortal(response.data.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPortal(controller.signal);
    return () => controller.abort();
  }, [loadPortal, user?.id]);

  // ── State resolution ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <WorkspaceLoading message="Loading your family portal…" />
        </div>
      </main>
    );
  }

  if (error) {
    const status = error.response?.status;

    if (status === 403) {
      return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-4xl">
            <WorkspaceForbidden message="Your account is not linked to a parent profile. Contact your school administrator." />
          </div>
        </main>
      );
    }

    if (!error.response) {
      return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-4xl">
            <WorkspaceOffline onRetry={() => loadPortal(new AbortController().signal)} />
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <WorkspaceError
            message={getApiErrorMessage(error, 'Unable to load parent portal')}
            onRetry={() => loadPortal(new AbortController().signal)}
          />
        </div>
      </main>
    );
  }

  // ── Successful render ──────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Family portal
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Welcome, {portal?.profile?.firstName ?? 'Parent'}
          </h1>
          <p className="mt-2 text-slate-400">
            Secure, read-only access to your linked children&apos;s school information.
          </p>
        </header>

        {!portal?.children?.length ? (
          <WorkspaceEmpty
            title="No linked children yet"
            message="Ask your school administrator to verify a student relationship."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="data-record-grid">
              {portal.children.map(({ student, relationship, permissions }) => (
                <article
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {student.profile?.firstName} {student.profile?.lastName}
                      </h2>
                      <p className="mt-1 text-slate-400">
                        {relationship} · {student.admissionNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {student.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-800 p-3">
                      <span className="text-slate-400">Academic</span>
                      <strong className="mt-1 block">
                        {permissions?.academic ? 'Available' : 'Restricted'}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-3">
                      <span className="text-slate-400">Attendance</span>
                      <strong className="mt-1 block">
                        {permissions?.attendance ? 'Available' : 'Restricted'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <a
                      href={`/parent-classroom?studentId=${student.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Open classroom workspace →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
