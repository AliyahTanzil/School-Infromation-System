import { useCallback, useEffect, useMemo, useState } from 'react';

import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const types = ['YEAR', 'TERM', 'BREAK', 'EXAM', 'EVENT'];
const emptyForm = {
  name: '',
  code: '',
  type: 'YEAR',
  startsAt: '',
  endsAt: '',
  parentId: '',
  description: '',
};
const statusStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PLANNED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-200 text-slate-600',
};
const dateRange = (item) =>
  `${new Date(item.startsAt).toLocaleDateString()} – ${new Date(item.endsAt).toLocaleDateString()}`;

export default function AcademicCalendarDashboard() {
  const [periods, setPeriods] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/academic-periods');
      setPeriods(response.data.data ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'ALL' ? periods : periods.filter((item) => item.type === filter)),
    [filter, periods]
  );
  const years = periods.filter((item) => item.type === 'YEAR');
  const current = periods.find((item) => item.status === 'ACTIVE');
  const next = periods.find((item) => new Date(item.startsAt) > new Date());

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        type: form.type,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        code: form.code || undefined,
      };
      if (['BREAK', 'EXAM', 'EVENT'].includes(form.type))
        await api.post('/academic-periods/events', {
          ...payload,
          description: form.description || undefined,
        });
      else
        await api.post('/academic-periods', { ...payload, parentId: form.parentId || undefined });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item, status) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/academic-periods/${item.id}/status`, { status });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Module 11
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Academic calendar</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Coordinate years, terms, breaks, exams, and school events from one authoritative
              timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {showForm ? 'Cancel' : 'Create period'}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {showForm && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Create calendar item</h2>
            <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span>Name</span>
                <input
                  required
                  className="rounded-lg border p-2"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Type</span>
                <select
                  className="rounded-lg border p-2"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value, parentId: '' })}
                >
                  {types.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Code</span>
                <input
                  required={['BREAK', 'EXAM', 'EVENT'].includes(form.type)}
                  className="rounded-lg border p-2"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="e.g. AY26 or EXAM-1"
                />
              </label>
              {form.type === 'TERM' && (
                <label className="grid gap-1 text-sm">
                  <span>Academic year</span>
                  <select
                    required
                    className="rounded-lg border p-2"
                    value={form.parentId}
                    onChange={(event) => setForm({ ...form, parentId: event.target.value })}
                  >
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option value={year.id} key={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="grid gap-1 text-sm">
                <span>Start date</span>
                <input
                  required
                  type="date"
                  className="rounded-lg border p-2"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>End date</span>
                <input
                  required
                  type="date"
                  className="rounded-lg border p-2"
                  value={form.endsAt}
                  onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                />
              </label>
              {['BREAK', 'EXAM', 'EVENT'].includes(form.type) && (
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span>Description</span>
                  <textarea
                    className="rounded-lg border p-2"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </label>
              )}
              <div className="md:col-span-2">
                <button
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
                  type="submit"
                >
                  {saving ? 'Saving…' : `Create ${form.type.toLowerCase()}`}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-indigo-950 p-5 text-white">
            <p className="text-sm text-indigo-200">Current period</p>
            <p className="mt-2 text-xl font-semibold">{current?.name ?? 'None active'}</p>
            <p className="mt-1 text-sm text-indigo-200">
              {current
                ? `Active until ${new Date(current.endsAt).toLocaleDateString()}`
                : 'Activate a planned period'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Next event</p>
            <p className="mt-2 text-xl font-semibold">{next?.name ?? 'Nothing scheduled'}</p>
            <p className="mt-1 text-sm text-slate-500">
              {next
                ? `Starts ${new Date(next.startsAt).toLocaleDateString()}`
                : 'Create a calendar item'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Calendar records</p>
            <p className="mt-2 text-xl font-semibold">{periods.length}</p>
            <p className="mt-1 text-sm text-slate-500">Years, terms, breaks, exams and events</p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-2">
          {['ALL', ...types].map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}
            >
              {type === 'ALL' ? 'All periods' : type}
            </button>
          ))}
        </div>
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading && <p className="p-5 text-sm text-slate-500">Loading calendar…</p>}
          {!loading && visible.length === 0 && (
            <p className="p-5 text-sm text-slate-500">No calendar items found.</p>
          )}
          {visible.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="grid gap-3 border-b border-slate-100 px-5 py-4 md:grid-cols-[1.3fr_0.5fr_1fr_1fr] md:items-center"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-slate-400">{item.code}</p>
              </div>
              <span className="text-sm text-slate-500">{item.type}</span>
              <span className="text-sm text-slate-500">{dateRange(item)}</span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
                {item.status === 'PLANNED' && (
                  <button
                    disabled={saving}
                    type="button"
                    onClick={() => changeStatus(item, 'ACTIVE')}
                    className="text-xs font-semibold text-indigo-600"
                  >
                    Activate
                  </button>
                )}
                {item.status === 'ACTIVE' && (
                  <button
                    disabled={saving}
                    type="button"
                    onClick={() => changeStatus(item, 'CLOSED')}
                    className="text-xs font-semibold text-slate-600"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
