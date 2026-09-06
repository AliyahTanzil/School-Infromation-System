import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateTimetableSlots,
  validateTimetableSettings,
} from '../../src/domain/timetableEngine.js';

const baseSettings = {
  workingDays: [1, 2, 3, 4, 5],
  schoolStartsAt: '08:00',
  schoolEndsAt: '14:00',
  lessonDurationMinutes: 60,
  breakStartsAt: '10:00',
  breakEndsAt: '10:20',
  lunchStartsAt: '12:20',
  lunchEndsAt: '13:00',
  maxPeriodsPerDay: 8,
  maxTeacherPeriodsDay: 6,
  maxTeacherPeriodsWeek: 30,
  maxConsecutivePeriods: 3,
  allowDoublePeriods: false,
  allowSaturday: false,
};

test('settings generate lesson, break, and lunch slots for every working day', () => {
  const slots = generateTimetableSlots(baseSettings);
  const monday = slots.filter((slot) => slot.weekday === 1);
  assert.deepEqual(monday, [
    {
      weekday: 1,
      startTime: '08:00',
      endTime: '09:00',
      label: 'Period 1',
      isBreak: false,
      kind: 'LESSON',
    },
    {
      weekday: 1,
      startTime: '09:00',
      endTime: '10:00',
      label: 'Period 2',
      isBreak: false,
      kind: 'LESSON',
    },
    {
      weekday: 1,
      startTime: '10:00',
      endTime: '10:20',
      label: 'Break',
      isBreak: true,
      kind: 'BREAK',
    },
    {
      weekday: 1,
      startTime: '10:20',
      endTime: '11:20',
      label: 'Period 3',
      isBreak: false,
      kind: 'LESSON',
    },
    {
      weekday: 1,
      startTime: '11:20',
      endTime: '12:20',
      label: 'Period 4',
      isBreak: false,
      kind: 'LESSON',
    },
    {
      weekday: 1,
      startTime: '12:20',
      endTime: '13:00',
      label: 'Lunch',
      isBreak: true,
      kind: 'LUNCH',
    },
    {
      weekday: 1,
      startTime: '13:00',
      endTime: '14:00',
      label: 'Period 5',
      isBreak: false,
      kind: 'LESSON',
    },
  ]);
  assert.equal(slots.length, monday.length * baseSettings.workingDays.length);
});

test('settings reject lunch outside school hours and overlapping break', () => {
  assert.throws(
    () => validateTimetableSettings({ ...baseSettings, lunchEndsAt: '15:00' }),
    /lunch must be within school hours/i
  );
  assert.throws(
    () =>
      validateTimetableSettings({
        ...baseSettings,
        lunchStartsAt: '10:10',
        lunchEndsAt: '11:00',
      }),
    /cannot overlap/i
  );
});

test('settings reject invalid day and duration configuration', () => {
  assert.throws(
    () => validateTimetableSettings({ ...baseSettings, workingDays: [1, 1] }),
    /duplicates/i
  );
  assert.throws(
    () => validateTimetableSettings({ ...baseSettings, lessonDurationMinutes: 0 }),
    /duration/i
  );
});
