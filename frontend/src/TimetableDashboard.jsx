import api from './api/auth.js';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ScienceTimetableDraft from './ScienceTimetableDraft.jsx';
import { printElement } from './printElement.js';
import WeeklyTimetableGrid from './WeeklyTimetableGrid.jsx';
import TimetableReadinessPanel from './TimetableReadinessPanel.jsx';
import TimetableEntryEditor from './TimetableEntryEditor.jsx';
import TimetableStaffingPanel from './TimetableStaffingPanel.jsx';

const statusTone = {
  DRAFT: 'bg-slate-100 text-slate-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  LOCKED: 'bg-indigo-100 text-indigo-700',
};
const requestHeaders = (schoolId) => ({
  'x-school-id': schoolId,
});

export default function TimetableDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [timetables, setTimetables] = useState([]);
  const [options, setOptions] = useState(null);
  const [selected, setSelected] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [readinessRefresh, setReadinessRefresh] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({
    name: '',
    code: '',
    kind: 'CLASSROOM',
    capacity: 40,
    resources: '',
  });
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    academicPeriodId: '',
    name: '',
    academicYear: '',
  });
  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await api.get('/timetables', { headers: requestHeaders(schoolId) });
    setTimetables(data.data);
    setSelected(
      (current) => data.data.find((item) => item.id === current?.id) || data.data[0] || null
    );
    sessionStorage.setItem('schoolId', schoolId);
  }, [schoolId]);
  const loadRooms = useCallback(async () => {
    if (!schoolId) return setRooms([]);
    const { data } = await api.get('/timetables/rooms', { headers: requestHeaders(schoolId) });
    setRooms(data.data);
  }, [schoolId]);
  useEffect(() => {
    load().catch(() => setMessage('Unable to load timetables.'));
  }, [load]);
  useEffect(() => {
    loadRooms().catch(() => setMessage('Unable to load timetable rooms.'));
  }, [loadRooms]);
  useEffect(() => {
    let active = true;
    setReadiness(null);
    setCheckingReadiness(false);
    if (!schoolId || !selected?.id) return;
    setCheckingReadiness(true);
    api
      .get(`/timetables/${selected.id}/readiness`, { headers: requestHeaders(schoolId) })
      .then(({ data }) => {
        if (active) setReadiness(data.data);
      })
      .catch(() => {
        if (active)
          setMessage('Readiness could not be checked. Use Check readiness again to retry.');
      })
      .finally(() => {
        if (active) setCheckingReadiness(false);
      });
    return () => {
      active = false;
    };
  }, [schoolId, selected, rooms, readinessRefresh]);
  useEffect(() => {
    api
      .get('/timetables/options', { headers: requestHeaders(schoolId) })
      .then(({ data }) => {
        setOptions(data.data);
        if (data.data.school?.id) setSchoolId(data.data.school.id);
      })
      .catch(() =>
        setMessage('School records are unavailable. The planning preview below is not saved.')
      );
  }, [schoolId]);
  const create = async (event) => {
    event.preventDefault();
    try {
      const generated = await api.get('/timetables/generated-slots', {
        headers: requestHeaders(schoolId),
      });
      await api.post(
        '/timetables',
        {
          academicPeriodId: form.academicPeriodId,
          name: form.name,
          academicYear: form.academicYear,
          slots: generated.data.data,
        },
        { headers: requestHeaders(schoolId) }
      );
      setMessage('Draft timetable created.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to create timetable.');
    }
  };
  const transition = async (status) => {
    if (!selected) return;
    try {
      await api.patch(
        `/timetables/${selected.id}/status`,
        { status },
        { headers: requestHeaders(schoolId) }
      );
      setMessage(`Timetable moved to ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Status change failed.');
    }
  };
  const generateSlots = async () => {
    if (!selected) return;
    try {
      await api.post(
        `/timetables/${selected.id}/generate-slots`,
        {},
        { headers: requestHeaders(schoolId) }
      );
      setMessage('Slots generated from school settings.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to generate timetable slots.');
    }
  };
  const generateSchedule = async () => {
    if (!selected) return;
    try {
      await api.post(
        `/timetables/${selected.id}/generate-schedule`,
        {},
        { headers: requestHeaders(schoolId) }
      );
      setMessage(
        'Complete timetable generated from requirements, staffing, availability, and rooms.'
      );
      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.error?.message ||
          'The timetable is not feasible with the current constraints.'
      );
    }
  };
  const createRoom = async (event) => {
    event.preventDefault();
    try {
      await api.post(
        '/timetables/rooms',
        {
          name: roomForm.name.trim(),
          code: roomForm.code.trim().toUpperCase(),
          kind: roomForm.kind,
          capacity: Number(roomForm.capacity),
          isActive: true,
          resources: roomForm.resources
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        { headers: requestHeaders(schoolId) }
      );
      setRoomForm({ name: '', code: '', kind: 'CLASSROOM', capacity: 40, resources: '' });
      setMessage('Timetable room created.');
      await loadRooms();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to create timetable room.');
    }
  };
  const toggleRoom = async (room) => {
    try {
      await api.patch(
        `/timetables/rooms/${room.id}`,
        { isActive: !room.isActive },
        { headers: requestHeaders(schoolId) }
      );
      setMessage(`${room.name} ${room.isActive ? 'deactivated' : 'activated'}.`);
      await loadRooms();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to update timetable room.');
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
            onClick={() =>
              printElement(selected ? 'operational-timetable-print' : 'science-timetable-print')
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-indigo-300"
          >
            Print timetable
          </button>
          <Link
            to="/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Back to administration
          </Link>
        </header>
        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
          >
            {message}
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Create timetable draft</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={create}>
            <label className="text-sm">
              School
              <input
                aria-label="School"
                readOnly
                value={options?.school?.name || 'Set up school records first'}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-sm">
              Academic term
              <select
                required
                aria-label="Academic term"
                value={form.academicPeriodId}
                className="mt-1 w-full rounded-lg border p-3"
                onChange={(event) => {
                  const year = options?.academicYears.find((item) =>
                    item.terms.some((term) => term.id === event.target.value)
                  );
                  setForm({
                    ...form,
                    academicPeriodId: event.target.value,
                    academicYear: year?.name || '',
                  });
                }}
              >
                <option value="">Select an academic term</option>
                {options?.academicYears.flatMap((year) =>
                  year.terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {year.name} - {term.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <input
              required
              placeholder="Timetable name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <input
              required
              placeholder="Academic year (2026/27)"
              value={form.academicYear}
              onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
            />
            <p className="text-sm text-slate-500 md:col-span-4">
              Creates an empty draft with all periods from saved school settings. The SSS Science 3A
              planning preview below is separate and is not imported by this button.
            </p>
            <button
              disabled={!options?.school || !form.academicPeriodId}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Create draft
            </button>
          </form>
        </section>
        <section
          id="timetable-rooms"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Rooms and resources</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add classrooms, laboratories, and shared teaching spaces before assigning lessons.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {rooms.filter((room) => room.isActive).length} active
            </span>
          </div>
          <form onSubmit={createRoom} className="mt-5 grid gap-3 md:grid-cols-5">
            <input
              required
              aria-label="Room name"
              placeholder="Room name"
              value={roomForm.name}
              onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })}
            />
            <input
              required
              aria-label="Room code"
              placeholder="Code"
              value={roomForm.code}
              onChange={(event) => setRoomForm({ ...roomForm, code: event.target.value })}
            />
            <select
              aria-label="Room type"
              value={roomForm.kind}
              onChange={(event) => setRoomForm({ ...roomForm, kind: event.target.value })}
              className="rounded-lg border p-3"
            >
              <option value="CLASSROOM">Classroom</option>
              <option value="LABORATORY">Laboratory</option>
              <option value="RESOURCE">Resource</option>
            </select>
            <input
              required
              min="1"
              type="number"
              aria-label="Room capacity"
              placeholder="Capacity"
              value={roomForm.capacity}
              onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })}
            />
            <input
              aria-label="Room resources"
              placeholder="Resources, comma separated"
              value={roomForm.resources}
              onChange={(event) => setRoomForm({ ...roomForm, resources: event.target.value })}
            />
            <button
              disabled={!schoolId}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white md:col-span-5 md:justify-self-start"
            >
              Add room
            </button>
          </form>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article key={room.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {room.code} · {room.kind.toLowerCase()} · capacity {room.capacity}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${room.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {room.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                {room.resources?.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">{room.resources.join(', ')}</p>
                )}
                <button
                  type="button"
                  onClick={() => toggleRoom(room)}
                  className="mt-3 text-xs font-semibold text-indigo-700"
                >
                  {room.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </article>
            ))}
            {!rooms.length && (
              <p className="text-sm text-slate-500">
                No timetable rooms configured for this school.
              </p>
            )}
          </div>
        </section>
        <div id="timetable-staffing">
          <TimetableStaffingPanel schoolId={schoolId} options={options} onMessage={setMessage} />
        </div>
        {!timetables.some((item) => item.name.startsWith('SSS Science 3A - First Term')) && (
          <ScienceTimetableDraft />
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
              <div id="timetable-workflow" className="flex gap-2">
                {(selected?.status === 'DRAFT' || selected?.status === 'REVIEW') && (
                  <button
                    onClick={generateSlots}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
                  >
                    Generate slots
                  </button>
                )}
                {selected?.status === 'DRAFT' && selected?.entries?.length === 0 && (
                  <button
                    onClick={generateSchedule}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Generate complete schedule
                  </button>
                )}
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
            {selected && (
              <TimetableReadinessPanel
                timetable={selected}
                report={readiness}
                checking={checkingReadiness}
                onCheck={() => setReadinessRefresh((value) => value + 1)}
              />
            )}
            <div className="mt-5 overflow-x-auto">
              <div id="operational-timetable-print">
                <WeeklyTimetableGrid
                  slots={selected?.slots || []}
                  entries={selected?.entries || []}
                />
              </div>
              {selected && (
                <div id="timetable-lessons">
                  <TimetableEntryEditor
                    key={selected.id}
                    timetable={selected}
                    options={options}
                    rooms={rooms}
                    onSaved={load}
                  />
                </div>
              )}
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
