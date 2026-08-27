import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSessionTransition,
  assertWritableSession,
  summarizeAttendance,
} from '../../src/domain/attendanceLifecycle.js';
import { readFile } from 'node:fs/promises';

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

test('attendance persistence and UI use the class-enrollment roster', async () => {
  const [schema, service, routes, app, dashboard] = await Promise.all([
    readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/application/services/attendanceService.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../src/presentation/http/routes/index.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../../frontend/src/AttendanceDashboard.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(schema, /model AttendanceSession \{/);
  assert.match(schema, /model AttendanceAudit \{/);
  assert.match(service, /tx\.classEnrollment\.findMany/);
  assert.match(service, /assertWritableSession/);
  assert.match(routes, /router\.use\('\/attendance', attendanceRoutes\)/);
  assert.match(app, /app\.use\('\/api\/attendance', attendanceRouter\)/);
  assert.doesNotMatch(dashboard, /const sessions = \[/);
  assert.match(dashboard, /fetch\('\/api\/attendance'/);
});
