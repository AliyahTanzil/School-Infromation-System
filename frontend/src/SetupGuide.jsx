import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import api from './api/auth.js';
import { setupSteps, followOnSteps, hasSetupRecord } from './setupSteps.js';

function SetupChecklist() {
  const [statuses, setStatuses] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
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
          <p>Follow this order. Return here after saving to see your next task.</p>
        </div>
        <button
          className="secondary-button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
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
        <p className="mb-4">
          <strong>{statuses[next.id] === 'unknown' ? 'Check next: ' : 'Start here: '}</strong>
          <Link className="underline" to={next.path}>
            {next.title}
          </Link>
        </p>
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
          <li
            key={step.id}
            className="rounded-xl border border-slate-300 p-4"
            aria-current={!loading && next?.id === step.id ? 'step' : undefined}
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
            <Link className="underline text-sm font-semibold" to={step.path}>
              Open {step.title.toLowerCase()}
            </Link>
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
            <li key={step.title} className="rounded-xl border border-slate-300 p-4">
              <Link className="underline font-semibold" to={step.path}>
                {step.title}
              </Link>
              <p className="mt-2 text-sm">{step.description}</p>
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
  return (
    <aside className="page-shell" aria-label="Setup guidance" style={{ marginBlock: '1rem' }}>
      <Link className="underline font-semibold" to="/admin#setup-guide">
        School setup guide
      </Link>
      {steps.map((step) => (
        <p className="mt-2 text-sm" key={step.title}>
          <strong>{step.title}: </strong>
          {step.description}
        </p>
      ))}
      <p className="mt-2 text-sm">
        After saving, return to the guide to check progress and continue.
      </p>
    </aside>
  );
}
