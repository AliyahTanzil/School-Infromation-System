import { useEffect, useState } from 'react';
import { Search, UserPlus, UsersRound } from 'lucide-react';

export default function TeacherDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/teachers?query=${encodeURIComponent(query)}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}` },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) => setTeachers(payload.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">People operations</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Teachers</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage teaching profiles, employment, and lifecycle status.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
            <UserPlus size={17} /> Add teacher
          </button>
        </header>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teachers or employee number"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </section>
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <UsersRound size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-900">Teaching team</h2>
            <span className="ml-auto text-xs text-slate-400">{teachers.length} records</span>
          </div>
          {loading ? (
            <p className="p-8 text-sm text-slate-500">Loading teachers…</p>
          ) : teachers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">No teachers found</p>
              <p className="mt-1 text-sm text-slate-500">
                Add a teacher to begin building your teaching team.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600">
                    {teacher.profile?.firstName?.[0]}
                    {teacher.profile?.lastName?.[0]}
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold text-slate-800">
                      {teacher.profile?.firstName} {teacher.profile?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{teacher.employeeNumber}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {teacher.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
