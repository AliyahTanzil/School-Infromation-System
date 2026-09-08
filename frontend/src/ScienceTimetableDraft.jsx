import { useState } from 'react';
import WeeklyTimetableGrid from './WeeklyTimetableGrid.jsx';
import { scienceSubjects, sciencePeriods, scienceWeek } from './scienceTimetableDraft.js';
import { printElement } from './printElement.js';

export default function ScienceTimetableDraft() {
  const [subjects, setSubjects] = useState(scienceSubjects);
  const slots = scienceWeek.flatMap((_, day) => [
    ...sciencePeriods.map(([startTime, endTime], period) => ({
      id: day + '-' + period,
      weekday: day + 1,
      startTime,
      endTime,
    })),
    {
      id: day + '-lunch',
      weekday: day + 1,
      startTime: '12:00',
      endTime: '12:40',
      isBreak: true,
      label: 'Lunch',
    },
  ]);
  const entries = scienceWeek.flatMap((periods, day) =>
    periods.map((subject, period) => ({
      id: day + '-' + period,
      timeSlotId: day + '-' + period,
      subjectCode: subjects[subject] || 'Additional subject ' + (subject - 4),
    }))
  );
  return (
    <section
      id="science-timetable-print"
      className="mt-8 rounded-2xl border border-indigo-200 bg-white p-5"
      aria-labelledby="science-draft-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Planning preview · Not saved
          </p>
          <h2 id="science-draft-title" className="mt-2 text-xl font-bold">
            SSS Science 3A — weekly draft
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Monday–Friday · 08:00–14:00 · 40-minute periods · 9 subjects
          </p>
        </div>
        <button
          type="button"
          onClick={() => printElement('science-timetable-print')}
          className="rounded-xl border px-4 py-2 text-sm font-semibold print:hidden"
        >
          Print draft
        </button>
      </div>
      <p className="mt-3 text-sm text-amber-800">
        Proposed allocation: each core subject has six periods weekly, including one double period.
        The four additional subjects below are provisional. School, term, teachers and rooms must be
        linked before this becomes an operational timetable.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        {subjects.slice(5).map((subject, offset) => (
          <label key={offset} className="text-xs font-semibold text-slate-600">
            Additional subject {offset + 1}
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={subject}
              onChange={(event) =>
                setSubjects((current) =>
                  current.map((name, index) => (index === offset + 5 ? event.target.value : name))
                )
              }
            />
          </label>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto">
        <WeeklyTimetableGrid slots={slots} entries={entries} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Weekly periods:{' '}
        {subjects
          .map(
            (subject, index) =>
              `${subject || `Additional subject ${index - 4}`} ${scienceWeek.flat().filter((item) => item === index).length}`
          )
          .join(' · ')}
        .
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Science double periods provide time for extended lessons; practical sessions still require
        confirmed laboratory and teacher availability.
      </p>
    </section>
  );
}
