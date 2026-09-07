/* eslint-disable react/prop-types */
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableReadinessPanel({ timetable, report }) {
  const lessons = (timetable.entries || []).filter(
    (entry) => !['BREAK', 'FREE'].includes(entry.kind)
  );
  const missing = lessons
    .map((entry) => ({
      entry,
      fields: [
        !entry.classId && 'Class',
        !entry.teacherId && 'Teacher',
        !(entry.roomId || entry.classroomId) && 'Room',
      ].filter(Boolean),
    }))
    .filter((item) => item.fields.length);
  const hardConflicts = (timetable.conflicts || []).filter(
    (conflict) => conflict.severity === 'HARD' && !conflict.resolvedAt
  );
  const serverIssues = report?.issues || [];
  const counts = [
    ['Lessons needing a class', lessons.filter((entry) => !entry.classId).length],
    ['Lessons needing a teacher', lessons.filter((entry) => !entry.teacherId).length],
    [
      'Lessons needing a room',
      lessons.filter((entry) => !(entry.roomId || entry.classroomId)).length,
    ],
    ['Unresolved hard conflicts', hardConflicts.length],
  ];
  return (
    <section
      className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
      aria-label="Timetable readiness"
    >
      <h3 className="text-lg font-semibold">Timetable readiness</h3>
      <p className="mt-1 text-sm text-slate-600">
        Assignment checklist for {timetable.name}. The server validates availability, capacity,
        workload and scheduling conflicts against saved school data.
      </p>
      {report && (
        <p
          role="status"
          className={`mt-3 text-sm ${report.ready ? 'text-emerald-700' : 'text-amber-700'}`}
        >
          {report.ready
            ? 'Server readiness checks passed. Workflow transition checks still apply.'
            : `${serverIssues.length} server readiness issue(s) must be resolved before release.`}
        </p>
      )}
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {counts.map(([label, count]) => (
          <div key={label} className="rounded-lg bg-white p-3">
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="text-xl font-semibold">{count}</dd>
          </div>
        ))}
      </dl>
      {!lessons.length ? (
        <p className="mt-4">
          No teaching lessons have been scheduled. Generate a schedule or add lessons to begin.
        </p>
      ) : !missing.length && !hardConflicts.length ? (
        <p role={report ? undefined : 'status'} className="mt-4">
          All lessons have class, teacher and room assignments. Publication checks still apply.
        </p>
      ) : (
        <p role={report ? undefined : 'status'} className="mt-4">
          Complete the missing assignments and resolve hard conflicts before releasing this
          timetable.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <a className="secondary-button" href="#timetable-staffing">
          Manage staffing and availability
        </a>
        <a className="secondary-button" href="#timetable-rooms">
          Manage rooms
        </a>
        <a className="secondary-button" href="#timetable-lessons">
          Assign or edit lessons
        </a>
      </div>
      {!!missing.length && (
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            {missing.length} lesson(s) with missing assignments
          </summary>
          <ul className="mt-3 space-y-2">
            {missing.map(({ entry, fields }) => {
              const slot =
                entry.timeSlot || timetable.slots?.find((item) => item.id === entry.timeSlotId);
              return (
                <li key={entry.id} className="rounded-lg bg-white p-3 text-sm">
                  <strong>
                    {entry.class?.name || 'Unassigned class'} �{' '}
                    {entry.subject?.name || entry.subjectCode || 'Unassigned subject'}
                  </strong>
                  <span className="block text-slate-600">
                    {slot
                      ? `${weekdays[slot.weekday - 1]} ${slot.startTime}`
                      : 'Period unavailable'}{' '}
                    � Missing: {fields.join(', ')}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      {!!serverIssues.length && (
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            {serverIssues.length} server-verified readiness issue(s)
          </summary>
          <ul className="mt-3 space-y-2">
            {serverIssues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="rounded-lg bg-white p-3 text-sm">
                <strong>{issue.code.replaceAll('_', ' ')}</strong>
                <span className="block text-slate-600">{issue.message}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
