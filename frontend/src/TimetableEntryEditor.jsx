/* eslint-disable react/prop-types */
import { useState } from 'react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
const empty = {
  classId: '',
  subjectId: '',
  teacherId: '',
  roomId: '',
  timeSlotId: '',
  kind: 'LESSON',
  duration: 1,
  notes: '',
};
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const teacherName = (teacher) =>
  [teacher.profile?.firstName, teacher.profile?.lastName].filter(Boolean).join(' ') ||
  teacher.employeeNumber;
export default function TimetableEntryEditor({ timetable, options, rooms, onSaved }) {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const editable = ['DRAFT', 'REVIEW'].includes(timetable.status);
  const subjects = options?.subjects || [];
  const slots = timetable.slots.filter((slot) => !slot.isBreak);
  function edit(entry) {
    setEditing(entry.id);
    setMessage('');
    setForm(
      Object.fromEntries(
        Object.keys(empty).map((key) => [
          key,
          entry[key] ??
            (key === 'subjectId'
              ? subjects.find((subject) => subject.code === entry.subjectCode)?.id || ''
              : empty[key]),
        ])
      )
    );
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const subject = subjects.find((item) => item.id === form.subjectId);
    try {
      const body = {
        ...form,
        subjectCode: subject.code,
        duration: Number(form.duration),
        teacherId: form.teacherId || null,
        roomId: form.roomId || null,
      };
      const path = `/timetables/${timetable.id}/entries`;
      if (editing) await api.patch(`${path}/${editing}`, body);
      else await api.post(path, body);
      setEditing(null);
      setForm(empty);
      await onSaved();
      setMessage('Lesson saved.');
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to save lesson'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-6 rounded-xl border border-slate-200 p-4">
      <h3 className="text-lg font-semibold">Manual lessons</h3>
      {!editable && <p>This timetable is read-only. Lessons can be edited in draft or review.</p>}
      {message && (
        <p role="status" className="my-3">
          {message}
        </p>
      )}
      {editable && (
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['classId', 'Class', options?.classes || [], true],
            ['subjectId', 'Subject', subjects, true],
            [
              'teacherId',
              'Teacher',
              (options?.teachers || []).map((item) => ({ ...item, name: teacherName(item) })),
              false,
            ],
            ['roomId', 'Room', rooms.filter((item) => item.isActive), false],
            [
              'timeSlotId',
              'Starting period',
              slots.map((item) => ({
                ...item,
                name: `${days[item.weekday - 1]} ${item.startTime}�${item.endTime}`,
              })),
              true,
            ],
          ].map(([key, label, items, required]) => (
            <label key={key}>
              {label}
              <select
                required={required}
                className="form-input"
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              >
                <option value="">
                  {required ? `Select ${label.toLowerCase()}` : 'Unassigned'}
                </option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Lesson type
            <select
              className="form-input"
              value={form.kind}
              onChange={(event) =>
                setForm({
                  ...form,
                  kind: event.target.value,
                  duration: event.target.value === 'DOUBLE' ? 2 : form.duration,
                })
              }
            >
              <option value="LESSON">Lesson</option>
              <option value="DOUBLE">Double lesson</option>
              <option value="PRACTICAL">Practical</option>
              <option value="LABORATORY">Laboratory</option>
            </select>
          </label>
          <label>
            Periods
            <input
              className="form-input"
              type="number"
              min="1"
              max="8"
              required
              disabled={form.kind === 'DOUBLE'}
              value={form.duration}
              onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })}
            />
          </label>
          <label>
            Notes
            <input
              className="form-input"
              maxLength={500}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <div className="flex gap-3">
            <button className="primary-button" disabled={busy || !slots.length}>
              {busy ? 'Saving�' : editing ? 'Save lesson changes' : 'Add lesson'}
            </button>
            {editing && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}
      <ul className="mt-4 space-y-2">
        {timetable.entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3 border-t py-2">
            <span>
              {entry.class?.name || 'Unassigned class'} � {entry.subject?.name || entry.subjectCode}{' '}
              �{' '}
              {
                days[
                  (entry.timeSlot?.weekday ||
                    slots.find((slot) => slot.id === entry.timeSlotId)?.weekday ||
                    1) - 1
                ]
              }{' '}
              {entry.timeSlot?.startTime ||
                slots.find((slot) => slot.id === entry.timeSlotId)?.startTime}{' '}
              � {entry.duration || 1} period(s)
            </span>
            {editable && (
              <button
                type="button"
                disabled={busy}
                className="secondary-button"
                onClick={() => edit(entry)}
              >
                Edit lesson
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
