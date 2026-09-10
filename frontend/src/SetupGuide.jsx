import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import api from './api/auth.js';
import { setupSteps, followOnSteps, hasSetupRecord } from './setupSteps.js';
import { subscribeSetupChanges } from './setupProgressEvents.js';

function renderPrerequisites(step, statuses) {
  const prerequisites = setupSteps.filter(
    (candidate) => step.requires?.includes(candidate.id) && statuses?.[candidate.id] !== 'done'
  );
  if (!prerequisites.length) return null;
  return (
    <p className="mt-2 text-sm">
      <strong>Prepare first: </strong>
      {prerequisites.map((prerequisite, index) => (
        <span key={prerequisite.id}>
          {index > 0 && ' · '}
          <Link className="underline" to={prerequisite.path}>
            {prerequisite.title}
          </Link>
        </span>
      ))}
    </p>
  );
}

function useSetupProgress() {
  const [statuses, setStatuses] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => subscribeSetupChanges(() => setRefresh((value) => value + 1)), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setStatuses({});
    async function load() {
      const requests = new Map();
      const request = (step) => {
        if (!requests.has(step.source)) {
          requests.set(
            step.source,
            (async () => {
              let cursor;
              const seen = new Set();
              do {
                const { data } = await api.get(step.source, {
                  params: cursor ? { ...step.params, cursor } : step.params,
                });
                const result = data.data;
                if (step.id !== 'teachers' || hasSetupRecord(result, step) || !result.nextCursor)
                  return result;
                cursor = result.nextCursor;
                if (seen.has(cursor)) throw new Error('Repeated user page');
                seen.add(cursor);
              } while (cursor);
            })()
          );
        }
        return requests.get(step.source);
      };
      const school = setupSteps[0];
      let schoolExists;
      try {
        schoolExists = hasSetupRecord(await request(school), school);
      } catch {
        if (active) {
          setStatuses({ school: 'unknown' });
          setLoading(false);
        }
        return;
      }
      const nextStatuses = { school: schoolExists ? 'done' : 'todo' };
      if (schoolExists) {
        await Promise.all(
          setupSteps.slice(1).map(async (step) => {
            try {
              nextStatuses[step.id] = hasSetupRecord(await request(step), step) ? 'done' : 'todo';
            } catch {
              nextStatuses[step.id] = 'unknown';
            }
          })
        );
      }
      if (active) {
        setStatuses(nextStatuses);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [refresh]);

  const completed = setupSteps.filter((step) => statuses[step.id] === 'done').length;
  const next = setupSteps.find((step) => statuses[step.id] !== 'done');
  return { statuses, loading, completed, next, refresh: () => setRefresh((value) => value + 1) };
}

function SetupChecklist() {
  const { statuses, loading, completed, next, refresh } = useSetupProgress();
  return (
    <section
      id="setup-guide"
      className="page-shell"
      aria-labelledby="setup-guide-title"
      style={{ marginBlock: '1rem' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Getting started</p>
          <h2 id="setup-guide-title" className="text-xl font-semibold">
            Set up your school, step by step
          </h2>
          <p>
            Start with your school, then work through the numbered tasks. Progress is checked from
            saved records.
          </p>
        </div>
        <button className="secondary-button" disabled={loading} onClick={refresh}>
          Refresh progress
        </button>
      </div>
      <div className="my-4" role="status" aria-live="polite">
        {loading
          ? 'Checking saved records…'
          : `${completed} of ${setupSteps.length} foundation steps have saved records.`}
        {!loading && (
          <progress
            className="block w-full mt-2"
            value={completed}
            max={setupSteps.length}
            aria-label="School setup progress"
          />
        )}
      </div>
      {!loading && next && (
        <div className="mb-4 rounded-xl border border-teal-500 p-4">
          <strong>{statuses[next.id] === 'unknown' ? 'Check next: ' : 'Start here: '}</strong>
          <Link className="underline" to={next.path}>
            {next.title}
          </Link>
          <p className="mt-2 text-sm">{next.description}</p>
        </div>
      )}
      {!loading && !next && (
        <p className="mb-4 font-semibold">
          Your foundation records are in place. Review assignments and continue with the tasks
          below.
        </p>
      )}
      {!loading && Object.values(statuses).includes('unknown') && (
        <p className="mb-4" role="alert">
          Some progress could not be checked. Refresh to retry, or ask an administrator to check
          your access. Unavailable checks are not marked complete.
        </p>
      )}
      <ol className="grid gap-3 md:grid-cols-2">
        {setupSteps.map((step, index) => (
          <li key={step.id} aria-current={!loading && next?.id === step.id ? 'step' : undefined}>
            <Link
              className="block rounded-xl border border-slate-300 p-4 transition-colors hover:border-teal-400 hover:bg-teal-400/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400"
              style={{ color: 'inherit', textDecoration: 'none' }}
              to={step.path}
              aria-label={`Open ${step.title.toLowerCase()}`}
            >
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold">
                  {index + 1}. {step.title}
                </h3>
                <span className="text-sm">
                  {loading
                    ? 'Checking…'
                    : statuses[step.id] === 'done'
                      ? 'Record saved'
                      : statuses[step.id] === 'unknown'
                        ? 'Unable to check'
                        : !statuses[step.id]
                          ? statuses.school === 'unknown'
                            ? 'Check school first'
                            : 'Create school first'
                          : 'To do'}
                </span>
              </div>
              <p className="my-2 text-sm">{step.description}</p>
              <span className="underline text-sm font-semibold">Open task →</span>
            </Link>
            {!loading && statuses[step.id] !== 'done' && renderPrerequisites(step, statuses)}
          </li>
        ))}
      </ol>
      <p className="my-4 text-sm">
        Progress confirms that at least one record exists for each step. Review all classes, people,
        and assignments before daily use.
      </p>
      <details>
        <summary className="cursor-pointer font-semibold">
          Continue setup: assignments, timetables, fees, and daily operations
        </summary>
        <ul className="grid gap-3 mt-3 md:grid-cols-2">
          {followOnSteps.map((step) => (
            <li key={step.title}>
              <Link
                className="block h-full rounded-xl border border-slate-300 p-4 transition-colors hover:border-teal-400 hover:bg-teal-400/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400"
                style={{ color: 'inherit', textDecoration: 'none' }}
                to={step.path}
                aria-label={step.title}
              >
                <span className="underline font-semibold">{step.title}</span>
                <p className="mt-2 text-sm">{step.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export default function SetupGuide() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isAdmin =
    user &&
    (['APPLICATION_MANAGER', 'TENANT_ADMIN'].includes(user.accountType) ||
      user.platformRole === 'OWNER' ||
      user.roles?.some((role) =>
        ['OWNER', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(role)
      ));
  if (!isAdmin) return null;
  if (pathname === '/admin' || pathname === '/dashboard')
    return <SetupChecklist key={`${user.id}:${user.tenantId}:${pathname}`} />;
  const steps = [...setupSteps, ...followOnSteps].filter((step) => step.path === pathname);
  if (!steps.length) return null;
  return <ContextualSetupGuide key={`${user.id}:${user.tenantId}:${pathname}`} />;
}

function ContextualSetupGuide() {
  const { pathname } = useLocation();
  const steps = [...setupSteps, ...followOnSteps].filter((step) => step.path === pathname);
  const { statuses, loading, next, refresh } = useSetupProgress();
  return (
    <aside className="page-shell" aria-label="Setup guidance" style={{ marginBlock: '1rem' }}>
      <Link className="underline font-semibold" to="/admin#setup-guide">
        School setup guide
      </Link>
      {steps.map((step) => (
        <div className="mt-3 text-sm" key={step.title}>
          <p>
            <strong>
              {step.id ? `Step ${setupSteps.indexOf(step) + 1} of ${setupSteps.length}: ` : ''}
              {step.title}
            </strong>
          </p>
          <p className="mt-1">{step.description}</p>
          {!loading && renderPrerequisites(step, statuses)}
        </div>
      ))}
      <p className="mt-3 text-sm" role="status" aria-live="polite">
        {loading
          ? 'Checking your setup progress…'
          : next
            ? statuses[next.id] === 'unknown'
              ? 'Progress could not be fully checked. Retry before continuing.'
              : next.path === pathname
                ? `Your next task is on this page: ${next.title}. Save it below to update your progress.`
                : `Recommended next task: ${next.title}.`
            : 'Your foundation records are in place. Continue with assignments and daily operations in the setup guide.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!loading && next && next.path !== pathname && (
          <Link className="primary-button" to={next.path}>
            {statuses[next.id] === 'unknown' ? 'Review' : 'Continue setup'}: {next.title}
          </Link>
        )}
        <button className="secondary-button" disabled={loading} onClick={refresh}>
          Refresh progress
        </button>
        <Link className="secondary-button" to="/admin#setup-guide">
          View full setup guide
        </Link>
      </div>
    </aside>
  );
}
