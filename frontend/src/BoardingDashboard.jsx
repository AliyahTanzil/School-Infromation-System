import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

export default function BoardingDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [overview, setOverview] = useState({
    dormitories: 0,
    rooms: 0,
    beds: 0,
    occupiedBeds: 0,
    pendingApplications: 0,
    availableBeds: 0,
  });
  const [dormitories, setDormitories] = useState([]);
  const [applications, setApplications] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [dormitory, setDormitory] = useState({ name: '', genderPolicy: 'MIXED' });
  const [room, setRoom] = useState({ dormitoryId: '', roomNumber: '', bedCount: 1 });
  const [application, setApplication] = useState({ studentId: '', notes: '' });
  const [allocation, setAllocation] = useState({ studentId: '', bedId: '' });
  const [message, setMessage] = useState('');
  const headers = { 'x-school-id': schoolId };
  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [o, d, a, l] = await Promise.all([
        api.get('/boarding/overview', { headers: { 'x-school-id': schoolId } }),
        api.get('/boarding/dormitories', { headers: { 'x-school-id': schoolId } }),
        api.get('/boarding/applications', { headers: { 'x-school-id': schoolId } }),
        api.get('/boarding/allocations', { headers: { 'x-school-id': schoolId } }),
      ]);
      setOverview(o.data.data);
      setDormitories(d.data.data ?? []);
      setApplications(a.data.data ?? []);
      setAllocations(l.data.data ?? []);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load boarding data.');
    }
  }, [schoolId]);
  useEffect(() => void load(), [load]);
  const create = async (event, path, body, reset) => {
    event.preventDefault();
    try {
      await api.post(path, body, { headers });
      reset();
      setMessage('Boarding record saved.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to save boarding record.');
    }
  };
  const decide = async (id, status) => {
    try {
      await api.patch(`/boarding/applications/${id}`, { status }, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to decide application.');
    }
  };
  const checkout = async (id) => {
    try {
      await api.post(`/boarding/allocations/${id}/checkout`, {}, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to check out student.');
    }
  };
  const availableBeds = dormitories.flatMap((d) =>
    d.rooms.flatMap((r) =>
      r.beds
        .filter((b) => b.status === 'AVAILABLE')
        .map((b) => ({ ...b, label: `${d.name} / ${r.roomNumber} / Bed ${b.bedNumber}` }))
    )
  );
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-indigo-300">Module 24</p>
            <h1 className="text-4xl font-bold">Boarding management</h1>
            <p className="text-slate-400">
              Dormitories, bed capacity, applications, allocations, and checkout.
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2">
            ← Back to administration
          </Link>
        </header>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <label>
            School context{' '}
            <input
              className="ml-3 rounded bg-slate-800 p-2"
              placeholder="School UUID"
              value={schoolId}
              onChange={(event) => {
                const value = event.target.value.trim();
                setSchoolId(value);
                sessionStorage.setItem('schoolId', value);
              }}
            />
          </label>
        </section>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-indigo-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(overview).map(([key, value]) => (
            <article key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-slate-400">{key}</p>
              <strong className="text-2xl">{value}</strong>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-4">
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/boarding/dormitories', dormitory, () =>
                setDormitory({ name: '', genderPolicy: 'MIXED' })
              )
            }
          >
            <h2 className="text-xl">Create dormitory</h2>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Name"
              value={dormitory.name}
              onChange={(event) => setDormitory({ ...dormitory, name: event.target.value })}
            />
            <select
              className="rounded bg-slate-800 p-3"
              value={dormitory.genderPolicy}
              onChange={(event) => setDormitory({ ...dormitory, genderPolicy: event.target.value })}
            >
              <option>MALE</option>
              <option>FEMALE</option>
              <option>MIXED</option>
            </select>
            <button disabled={!schoolId} className="rounded bg-indigo-600 p-3">
              Create
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(
                event,
                `/boarding/dormitories/${room.dormitoryId}/rooms`,
                { roomNumber: room.roomNumber, bedCount: room.bedCount },
                () => setRoom({ dormitoryId: '', roomNumber: '', bedCount: 1 })
              )
            }
          >
            <h2 className="text-xl">Add room and beds</h2>
            <select
              required
              className="rounded bg-slate-800 p-3"
              value={room.dormitoryId}
              onChange={(event) => setRoom({ ...room, dormitoryId: event.target.value })}
            >
              <option value="">Dormitory</option>
              {dormitories.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Room number"
              value={room.roomNumber}
              onChange={(event) => setRoom({ ...room, roomNumber: event.target.value })}
            />
            <input
              required
              min="1"
              max="50"
              type="number"
              className="rounded bg-slate-800 p-3"
              value={room.bedCount}
              onChange={(event) => setRoom({ ...room, bedCount: event.target.value })}
            />
            <button disabled={!room.dormitoryId} className="rounded bg-indigo-600 p-3">
              Add room
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/boarding/applications', application, () =>
                setApplication({ studentId: '', notes: '' })
              )
            }
          >
            <h2 className="text-xl">Boarding application</h2>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Student UUID"
              value={application.studentId}
              onChange={(event) =>
                setApplication({ ...application, studentId: event.target.value })
              }
            />
            <textarea
              className="rounded bg-slate-800 p-3"
              placeholder="Notes"
              value={application.notes}
              onChange={(event) => setApplication({ ...application, notes: event.target.value })}
            />
            <button disabled={!schoolId} className="rounded bg-indigo-600 p-3">
              Submit
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/boarding/allocations', allocation, () =>
                setAllocation({ studentId: '', bedId: '' })
              )
            }
          >
            <h2 className="text-xl">Allocate bed</h2>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Student UUID"
              value={allocation.studentId}
              onChange={(event) => setAllocation({ ...allocation, studentId: event.target.value })}
            />
            <select
              required
              className="rounded bg-slate-800 p-3"
              value={allocation.bedId}
              onChange={(event) => setAllocation({ ...allocation, bedId: event.target.value })}
            >
              <option value="">Available bed</option>
              {availableBeds.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
            <button disabled={!allocation.bedId} className="rounded bg-indigo-600 p-3">
              Allocate
            </button>
          </form>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Applications</h2>
            {applications.map((row) => (
              <div
                key={row.id}
                className="mt-3 flex justify-between gap-3 border-t border-slate-800 pt-3"
              >
                <span>
                  <strong>{row.studentId}</strong>
                  <small className="block text-slate-400">{row.status}</small>
                </span>
                {row.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(row.id, 'APPROVED')}
                      className="rounded bg-emerald-700 px-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(row.id, 'REJECTED')}
                      className="rounded bg-rose-700 px-3"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Allocations</h2>
            {allocations.map((row) => (
              <div
                key={row.id}
                className="mt-3 flex justify-between gap-3 border-t border-slate-800 pt-3"
              >
                <span>
                  <strong>{row.studentId}</strong>
                  <small className="block text-slate-400">
                    {row.bed.room.dormitory.name} / {row.bed.room.roomNumber} / Bed{' '}
                    {row.bed.bedNumber} · {row.status}
                  </small>
                </span>
                {row.status === 'ACTIVE' && (
                  <button onClick={() => checkout(row.id)} className="rounded bg-amber-700 px-3">
                    Check out
                  </button>
                )}
              </div>
            ))}
          </article>
        </section>
      </div>
    </main>
  );
}
