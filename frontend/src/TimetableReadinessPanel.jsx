/* eslint-disable react/prop-types */
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableReadinessPanel({ timetable, report, onCheck, checking = false }) {
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
  const nextAction = !lessons.length
    ? {
        label: 'Add teaching lessons',
        target: '#timetable-lessons',
        description: 'Prepare staffing and rooms, then add lessons in the editor below.',
      }
    : missing.length
      ? {
          label: 'Complete lesson assignments',
          target: '#timetable-lessons',
          description: 'Give every teaching lesson a class, teacher, and room.',
        }
      : hardConflicts.length
        ? {
            label: 'Resolve scheduling conflicts',
            target: '#timetable-lessons',
            description: 'Review conflicting lessons and adjust their times, teachers, or rooms.',
          }
        : !report
          ? {
              label: 'Check server readiness',
              description: 'Run the server checks before moving to review or publication.',
            }
          : !report.ready
            ? {
                label: 'Resolve server readiness issues',
                target: '#timetable-server-issues',
                description:
                  'Open the issue list below. Update staffing, availability, rooms, or lessons as indicated, then check readiness again.',
              }
            : timetable.status === 'DRAFT'
              ? {
                  label: 'Send the timetable to review',
                  target: '#timetable-workflow',
                  description:
                    'Use Send to review so the schedule can be reviewed before publication.',
                }
              : timetable.status === 'REVIEW'
                ? {
                    label: 'Review and publish the timetable',
                    target: '#timetable-workflow',
                    description:
                      'Review the weekly schedule, then use Publish when it is approved.',
                  }
                : {
                    label: 'Review the released schedule',
                    target: '#operational-timetable-print',
                    description:
                      'The timetable has been released. Review or print the schedule for daily use.',
                  };
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
      <div
        className="mt-4 rounded-lg border border-indigo-200 bg-white p-4"
        aria-label="Next timetable task"
      >
        <p className="font-semibold">Next: {nextAction.label}</p>
        <p className="mt-1 text-sm text-slate-600">{nextAction.description}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {nextAction.target && (
            <a className="secondary-button" href={nextAction.target}>
              Go to next task
            </a>
          )}
          {onCheck && (
            <button className="secondary-button" disabled={checking} onClick={onCheck}>
              {checking ? 'Checking readiness…' : 'Check readiness again'}
            </button>
          )}
        </div>
      </div>
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
        <details id="timetable-server-issues" open className="mt-4">
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
