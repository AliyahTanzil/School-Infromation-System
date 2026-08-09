import axios from 'axios';
import { useEffect, useState } from 'react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});
const statusTone = {
  DRAFT: 'bg-slate-100 text-slate-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  LOCKED: 'bg-indigo-100 text-indigo-700',
};

export default function TimetableDashboard() {
  const [timetables, setTimetables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const load = async () => {
    const { data } = await api.get('/timetables');
    setTimetables(data.data);
    setSelected((current) => current || data.data[0] || null);
  };
  useEffect(() => {
    load().catch(() => setMessage('Unable to load timetables.'));
  }, []);
  const transition = async (status) => {
    if (!selected) return;
    try {
      await api.patch(`/timetables/${selected.id}/status`, { status });
      setMessage(`Timetable moved to ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Status change failed.');
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Module 16
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Timetable operations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Build, validate, review, publish, and lock deterministic school schedules.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-indigo-300"
          >
            Print timetable
          </button>
        </header>
        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
          >
            {message}
          </p>
        )}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-indigo-950 p-5 text-white">
            <p className="text-sm text-indigo-200">Timetables</p>
            <p className="mt-2 text-3xl font-bold">{timetables.length}</p>
            <p className="mt-1 text-sm text-indigo-200">School schedule versions</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Current workflow</p>
            <p className="mt-2 text-xl font-semibold">{selected?.status || 'No draft selected'}</p>
            <p className="mt-1 text-sm text-slate-500">Publication is blocked by hard conflicts.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Entries</p>
            <p className="mt-2 text-3xl font-bold">{selected?.entries?.length || 0}</p>
            <p className="mt-1 text-sm text-slate-500">Validated schedule assignments</p>
          </div>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.5fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Schedule versions</h2>
            <div className="mt-4 space-y-2">
              {timetables.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-xl border p-4 text-left ${selected?.id === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{item.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusTone[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.academicYear} · v{item.version}
                  </p>
                </button>
              ))}
              {!timetables.length && (
                <p className="text-sm text-slate-500">No timetables have been created yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{selected?.name || 'Select a timetable'}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected?.academicPeriod?.name || 'Academic period not selected'}
                </p>
              </div>
              <div className="flex gap-2">
                {selected?.status === 'DRAFT' && (
                  <button
                    onClick={() => transition('REVIEW')}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Send to review
                  </button>
                )}
                {selected?.status === 'REVIEW' && (
                  <button
                    onClick={() => transition('PUBLISHED')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Publish
                  </button>
                )}
                {selected?.status === 'PUBLISHED' && (
                  <button
                    onClick={() => transition('LOCKED')}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Lock
                  </button>
                )}
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Day / slot</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {selected?.entries?.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-50">
                      <td className="px-3 py-3 font-medium">
                        {entry.timeSlot?.label || 'Scheduled slot'}
                      </td>
                      <td className="px-3 py-3">{entry.subjectCode}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {entry.class?.name || 'Unassigned'}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {entry.classroom?.name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected?.conflicts?.length > 0 && (
                <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  <strong>{selected.conflicts.length} conflict(s) detected.</strong> Resolve hard
                  conflicts before publishing.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
