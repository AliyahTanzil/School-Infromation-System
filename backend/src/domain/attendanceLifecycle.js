import { AttendanceSessionStatus, AttendanceStatus } from '@prisma/client';

const transitions = {
  [AttendanceSessionStatus.DRAFT]: [AttendanceSessionStatus.OPEN, AttendanceSessionStatus.ARCHIVED],
  [AttendanceSessionStatus.OPEN]: [AttendanceSessionStatus.LOCKED],
  [AttendanceSessionStatus.LOCKED]: [AttendanceSessionStatus.ARCHIVED],
  [AttendanceSessionStatus.ARCHIVED]: [],
};

export function assertSessionTransition(from, to) {
  if (!transitions[from]?.includes(to))
    throw new Error(`Invalid attendance session transition: ${from} -> ${to}`);
}

export function assertWritableSession(status) {
  if (status !== AttendanceSessionStatus.OPEN) throw new Error('Attendance session is not open');
}

export function assertAttendanceStatus(status) {
  if (!Object.values(AttendanceStatus).includes(status))
    throw new Error('Invalid attendance status');
}

export function summarizeAttendance(records) {
  return records.reduce(
    (summary, record) => {
      summary.total += 1;
      summary[record.status.toLowerCase()] += 1;
      return summary;
    },
    { total: 0, present: 0, absent: 0, late: 0, excused: 0, half_day: 0 }
  );
}
