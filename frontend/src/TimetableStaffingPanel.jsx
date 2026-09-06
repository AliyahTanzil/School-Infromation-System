/* eslint-disable react/prop-types */
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});
const headers = (schoolId) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'x-school-id': schoolId,
});
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const teacherName = (teacher) =>
  [teacher.profile?.firstName, teacher.profile?.lastName].filter(Boolean).join(' ') ||
  teacher.employeeNumber;

export default function TimetableStaffingPanel({ schoolId, options, onMessage }) {
  const [assignments, setAssignments] = useState([]);
  const [rules, setRules] = useState([]);
  const [assignment, setAssignment] = useState({
    teacherId: '',
    subjectId: '',
    classId: '',
    termId: '',
    periodsPerWeek: 1,
  });
  const [availability, setAvailability] = useState({
    dayOfWeek: 1,
    startsAt: '08:00',
    endsAt: '16:00',
    kind: 'AVAILABLE',
    priority: 0,
  });
  const yearForTerm = useMemo(
    () =>
      options?.academicYears?.find((year) =>
        year.terms.some((term) => term.id === assignment.termId)
      ),
    [assignment.termId, options]
  );
  const selectedTeacher = options?.teachers?.find((teacher) => teacher.id === assignment.teacherId);

  const loadAssignments = useCallback(async () => {
    if (!schoolId) return setAssignments([]);
    const { data } = await api.get('/timetables/teaching-assignments', {
      headers: headers(schoolId),
    });
    setAssignments(data.data);
  }, [schoolId]);
  const loadRules = useCallback(async () => {
    if (!schoolId || !assignment.teacherId) return setRules([]);
    const { data } = await api.get(`/timetables/teachers/${assignment.teacherId}/availability`, {
      headers: headers(schoolId),
    });
    setRules(data.data);
  }, [assignment.teacherId, schoolId]);
  useEffect(() => {
    loadAssignments().catch(() => onMessage('Unable to load teaching assignments.'));
  }, [loadAssignments, onMessage]);
  useEffect(() => {
    loadRules().catch(() => onMessage('Unable to load teacher availability.'));
  }, [loadRules, onMessage]);

  async function addAssignment(event) {
    event.preventDefault();
    if (!yearForTerm) return onMessage('Select a valid academic term.');
    try {
      await api.post(
        '/timetables/teaching-assignments',
        {
          ...assignment,
          academicYearId: yearForTerm.id,
          periodsPerWeek: Number(assignment.periodsPerWeek),
          status: 'ACTIVE',
        },
        { headers: headers(schoolId) }
      );
      onMessage('Teaching assignment created.');
      await loadAssignments();
    } catch (error) {
      onMessage(error.response?.data?.error?.message || 'Unable to create teaching assignment.');
    }
  }
  async function removeAssignment(id) {
    try {
      await api.delete(`/timetables/teaching-assignments/${id}`, { headers: headers(schoolId) });
      onMessage('Teaching assignment removed.');
      await loadAssignments();
    } catch (error) {
      onMessage(error.response?.data?.error?.message || 'Unable to remove teaching assignment.');
    }
  }
  async function addAvailability(event) {
    event.preventDefault();
    try {
      await api.post(
        `/timetables/teachers/${assignment.teacherId}/availability`,
        {
          ...availability,
          dayOfWeek: Number(availability.dayOfWeek),
          priority: Number(availability.priority),
          isRecurring: true,
        },
        { headers: headers(schoolId) }
      );
      onMessage('Teacher availability saved.');
      await loadRules();
    } catch (error) {
      onMessage(error.response?.data?.error?.message || 'Unable to save teacher availability.');
    }
  }
  async function removeAvailability(id) {
    try {
      await api.delete(`/timetables/teachers/${assignment.teacherId}/availability/${id}`, {
        headers: headers(schoolId),
      });
      onMessage('Availability rule removed.');
      await loadRules();
    } catch (error) {
      onMessage(error.response?.data?.error?.message || 'Unable to remove availability rule.');
    }
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Teaching assignments</h2>
        <p className="mt-1 text-sm text-slate-500">
          Connect teachers to subjects, classes, terms, and weekly workloads.
        </p>
        <form onSubmit={addAssignment} className="mt-5 grid gap-3 sm:grid-cols-2">
          <select
            required
            aria-label="Teacher"
            value={assignment.teacherId}
            onChange={(e) => setAssignment({ ...assignment, teacherId: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="">Select teacher</option>
            {options?.teachers?.map((item) => (
              <option key={item.id} value={item.id}>
                {teacherName(item)}
              </option>
            ))}
          </select>
          <select
            required
            aria-label="Subject"
            value={assignment.subjectId}
            onChange={(e) => setAssignment({ ...assignment, subjectId: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="">Select subject</option>
            {options?.subjects?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            required
            aria-label="Class"
            value={assignment.classId}
            onChange={(e) => setAssignment({ ...assignment, classId: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="">Select class</option>
            {options?.classes?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            required
            aria-label="Assignment term"
            value={assignment.termId}
            onChange={(e) => setAssignment({ ...assignment, termId: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="">Select term</option>
            {options?.academicYears?.flatMap((year) =>
              year.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {year.name} - {term.name}
                </option>
              ))
            )}
          </select>
          <input
            required
            min="1"
            max="60"
            type="number"
            aria-label="Periods per week"
            value={assignment.periodsPerWeek}
            onChange={(e) => setAssignment({ ...assignment, periodsPerWeek: e.target.value })}
          />
          <button
            disabled={!schoolId}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Add assignment
          </button>
        </form>
        <ul className="mt-5 space-y-2">
          {assignments.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"
            >
              <span>
                <strong>{teacherName(item.teacher)}</strong>
                <span className="block text-xs text-slate-500">
                  {item.subject.name} · {item.class.name} · {item.periodsPerWeek} periods
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAssignment(item.id)}
                className="text-xs font-semibold text-rose-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Teacher availability</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a teacher above, then define recurring weekly windows.
        </p>
        <form onSubmit={addAvailability} className="mt-5 grid gap-3 sm:grid-cols-2">
          <select
            aria-label="Availability day"
            value={availability.dayOfWeek}
            onChange={(e) => setAvailability({ ...availability, dayOfWeek: e.target.value })}
            className="rounded-lg border p-3"
          >
            {weekdays.map((day, index) => (
              <option key={day} value={index + 1}>
                {day}
              </option>
            ))}
          </select>
          <select
            aria-label="Availability type"
            value={availability.kind}
            onChange={(e) => setAvailability({ ...availability, kind: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="PREFERRED">Preferred</option>
          </select>
          <input
            required
            type="time"
            aria-label="Availability starts"
            value={availability.startsAt}
            onChange={(e) => setAvailability({ ...availability, startsAt: e.target.value })}
          />
          <input
            required
            type="time"
            aria-label="Availability ends"
            value={availability.endsAt}
            onChange={(e) => setAvailability({ ...availability, endsAt: e.target.value })}
          />
          <button
            disabled={!selectedTeacher}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            Add availability
          </button>
        </form>
        <p className="mt-4 text-sm font-medium">
          {selectedTeacher ? teacherName(selectedTeacher) : 'No teacher selected'}
        </p>
        <ul className="mt-3 space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"
            >
              <span>
                {weekdays[rule.dayOfWeek - 1]} · {rule.startsAt}-{rule.endsAt} ·{' '}
                {rule.kind.toLowerCase()}
              </span>
              <button
                type="button"
                onClick={() => removeAvailability(rule.id)}
                className="text-xs font-semibold text-rose-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
