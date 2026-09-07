import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import TimetableReadinessPanel from './TimetableReadinessPanel.jsx';
afterEach(cleanup);
const slot = { id: 'slot', weekday: 1, startTime: '08:00' };
const table = {
  name: 'First Term',
  slots: [slot],
  conflicts: [],
  entries: [
    {
      id: 'lesson',
      kind: 'DOUBLE',
      duration: 2,
      classId: 'class',
      subjectCode: 'MATH',
      timeSlotId: 'slot',
    },
  ],
};
function metric(label) {
  return screen.getByText(label).parentElement;
}
it('shows missing assignments from real lessons and links to corrective sections', () => {
  render(<TimetableReadinessPanel timetable={table} />);
  expect(within(metric('Lessons needing a teacher')).getByText('1')).toBeInTheDocument();
  expect(within(metric('Lessons needing a room')).getByText('1')).toBeInTheDocument();
  expect(within(metric('Lessons needing a class')).getByText('0')).toBeInTheDocument();
  expect(screen.getByText('Monday 08:00 � Missing: Teacher, Room')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage rooms' })).toHaveAttribute(
    'href',
    '#timetable-rooms'
  );
  expect(screen.getByRole('link', { name: 'Assign or edit lessons' })).toHaveAttribute(
    'href',
    '#timetable-lessons'
  );
});
it('excludes breaks/free periods and resolved conflicts without claiming publication is guaranteed', () => {
  render(
    <TimetableReadinessPanel
      timetable={{
        ...table,
        entries: [
          { ...table.entries[0], teacherId: 'teacher', classroomId: 'legacy-room' },
          { id: 'break', kind: 'BREAK' },
          { id: 'free', kind: 'FREE' },
        ],
        conflicts: [{ severity: 'HARD', resolvedAt: '2026-09-07' }, { severity: 'SOFT' }],
      }}
    />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Publication checks still apply');
  expect(within(metric('Lessons needing a teacher')).getByText('0')).toBeInTheDocument();
  expect(within(metric('Unresolved hard conflicts')).getByText('0')).toBeInTheDocument();
});
it('an empty draft is not reported as complete', () => {
  render(<TimetableReadinessPanel timetable={{ ...table, entries: [] }} />);
  expect(screen.getByText(/No teaching lessons have been scheduled/)).toBeInTheDocument();
  expect(screen.queryByText(/All lessons have/)).not.toBeInTheDocument();
});
it('updates readiness when saved timetable data changes', () => {
  const view = render(<TimetableReadinessPanel timetable={table} />);
  view.rerender(
    <TimetableReadinessPanel
      timetable={{
        ...table,
        entries: [{ ...table.entries[0], teacherId: 'teacher', roomId: 'room' }],
        conflicts: [{ severity: 'HARD' }],
      }}
    />
  );
  expect(within(metric('Lessons needing a teacher')).getByText('0')).toBeInTheDocument();
  expect(within(metric('Unresolved hard conflicts')).getByText('1')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('resolve hard conflicts');
});
it('renders server-verified blockers when a readiness report is supplied', () => {
  render(
    <TimetableReadinessPanel
      timetable={table}
      report={{
        ready: false,
        issues: [
          {
            code: 'MISSING_TEACHING_ASSIGNMENT',
            message: 'SSS 3A: Mathematics has no active teacher assignment',
          },
        ],
      }}
    />
  );
  expect(screen.getByRole('status')).toHaveTextContent('1 server readiness issue');
  expect(screen.getByText('MISSING TEACHING ASSIGNMENT')).toBeInTheDocument();
  expect(
    screen.getByText('SSS 3A: Mathematics has no active teacher assignment')
  ).toBeInTheDocument();
});
