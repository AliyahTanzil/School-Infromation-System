import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSessionTransition,
  assertWritableSession,
  summarizeAttendance,
} from '../../src/domain/attendanceLifecycle.js';

test('attendance lifecycle allows opening then locking a session', () => {
  assert.doesNotThrow(() => assertSessionTransition('DRAFT', 'OPEN'));
  assert.doesNotThrow(() => assertSessionTransition('OPEN', 'LOCKED'));
  assert.throws(() => assertSessionTransition('LOCKED', 'OPEN'));
});

test('attendance only allows marking open sessions', () => {
  assert.doesNotThrow(() => assertWritableSession('OPEN'));
  assert.throws(() => assertWritableSession('LOCKED'));
});

test('attendance summarizes roster statuses', () => {
  assert.deepEqual(
    summarizeAttendance([{ status: 'PRESENT' }, { status: 'LATE' }, { status: 'ABSENT' }]),
    { total: 3, present: 1, absent: 1, late: 1, excused: 0, half_day: 0 }
  );
});
