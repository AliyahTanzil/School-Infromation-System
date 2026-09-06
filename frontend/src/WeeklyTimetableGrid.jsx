const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const optionalArray = (props, key, component) =>
  props[key] === undefined || Array.isArray(props[key])
    ? null
    : new Error(`${component}.${key} must be an array`);

WeeklyTimetableGrid.propTypes = { slots: optionalArray, entries: optionalArray };

export default function WeeklyTimetableGrid({ slots = [], entries = [] }) {
  const times = [
    ...new Map(slots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot])).values(),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
  const days = [...new Set(slots.map((slot) => slot.weekday))].sort((a, b) => a - b);
  return (
    <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
      <thead>
        <tr className="bg-indigo-950 text-white">
          <th scope="col" className="p-3">
            Day
          </th>
          {times.map((time) => (
            <th
              scope="col"
              key={`${time.startTime}-${time.endTime}`}
              className="whitespace-nowrap p-3 text-xs"
            >
              {time.startTime}–{time.endTime}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day} className="border-b border-slate-200">
            <th scope="row" className="p-3">
              {dayNames[day]}
            </th>
            {times.map((time) => {
              const matchingSlots = slots.filter(
                (slot) =>
                  slot.weekday === day &&
                  slot.startTime === time.startTime &&
                  slot.endTime === time.endTime
              );
              const lessons = entries.filter((entry) =>
                matchingSlots.some((slot) => slot.id === entry.timeSlotId)
              );
              const breakSlot = matchingSlots.find((slot) => slot.isBreak);
              return (
                <td
                  key={`${time.startTime}-${time.endTime}`}
                  className={`p-3 align-top ${breakSlot ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-950'}`}
                >
                  {breakSlot
                    ? breakSlot.label
                    : lessons.length
                      ? lessons.map((entry) => (
                          <div key={entry.id} className="mb-1">
                            <span className="font-semibold">
                              {entry.subject?.name || entry.subjectCode}
                            </span>
                            {entry.class?.name && (
                              <span className="block text-xs text-slate-500">
                                {entry.class.name}
                              </span>
                            )}
                            {entry.room?.name && (
                              <span className="block text-xs text-slate-500">
                                {entry.room.name}
                              </span>
                            )}
                          </div>
                        ))
                      : matchingSlots.length
                        ? 'Unassigned'
                        : '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
