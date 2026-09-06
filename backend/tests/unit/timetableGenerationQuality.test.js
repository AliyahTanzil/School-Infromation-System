import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreTimetableCandidate } from '../../src/domain/timetableEngine.js';

const requirement = { classId: 'class-1', subjectId: 'math', preferredPeriodsDay: 1 };
const assignment = { teacherId: 'teacher-1', classId: 'class-1' };
const monday = [{ weekday: 1, startTime: '08:00', endTime: '08:40' }];
const tuesday = [{ weekday: 2, startTime: '08:00', endTime: '08:40' }];

test('candidate scoring spreads a subject across days before repeating it', () => {
  const dailyCounts = { subject: { 'class-1:math:1': 1 }, class: {}, teacher: {} };
  assert.ok(
    scoreTimetableCandidate({ slots: tuesday, requirement, assignment, dailyCounts }) <
      scoreTimetableCandidate({ slots: monday, requirement, assignment, dailyCounts })
  );
});

test('candidate scoring honors teacher preferred windows when load is equal', () => {
  const availability = [
    {
      teacherId: 'teacher-1',
      dayOfWeek: 2,
      startsAt: '08:00',
      endsAt: '09:00',
      kind: 'PREFERRED',
      priority: 10,
      isRecurring: true,
    },
  ];
  const dailyCounts = { subject: {}, class: {}, teacher: {} };
  assert.ok(
    scoreTimetableCandidate({
      slots: tuesday,
      requirement,
      assignment,
      availability,
      dailyCounts,
    }) <
      scoreTimetableCandidate({ slots: monday, requirement, assignment, availability, dailyCounts })
  );
});
