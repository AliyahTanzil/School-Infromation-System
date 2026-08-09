import { useEffect, useState } from 'react';

export default function ParentPortal() {
  const [portal, setPortal] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/parents/me', {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}` },
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Unable to load parent portal'))
      )
      .then(({ data }) => setPortal(data))
      .catch((reason) => setError(reason.message));
  }, []);
  if (error)
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>{error}</p>
      </main>
    );
  if (!portal)
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Loading parent portal...</p>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Family portal
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Welcome, {portal.profile?.firstName ?? 'Parent'}
          </h1>
          <p className="mt-2 text-slate-400">
            Secure, read-only access to your linked children&apos;s school information.
          </p>
        </header>
        {portal.children.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-xl font-semibold">No linked children yet</h2>
            <p className="mt-2 text-slate-400">
              Ask your school administrator to verify a student relationship.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
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
                      {permissions.academic ? 'Available' : 'Restricted'}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3">
                    <span className="text-slate-400">Attendance</span>
                    <strong className="mt-1 block">
                      {permissions.attendance ? 'Available' : 'Restricted'}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
