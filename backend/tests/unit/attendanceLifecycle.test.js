import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSessionTransition,
  assertWritableSession,
  summarizeAttendance,
} from '../../src/domain/attendanceLifecycle.js';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import {
  assertAttendanceClassAccess,
  getTeacherAttendanceClassIds,
} from '../../src/application/services/attendanceService.js';
import {
  attendanceBulkSchema,
  attendanceSessionIdSchema,
  attendanceSessionStatusSchema,
} from '../../src/application/validators/attendanceValidators.js';

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
  assert.match(dashboard, /api\.get\('\/attendance'\)/);
});

test('attendance session identifiers are validated for reads and mutations', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(attendanceSessionIdSchema.safeParse({ params: { id } }).success, true);
  assert.equal(attendanceSessionIdSchema.safeParse({ params: { id: 'invalid' } }).success, false);
  assert.equal(
    attendanceSessionStatusSchema.safeParse({
      params: { id },
      body: { status: 'OPEN' },
    }).success,
    true
  );
  assert.equal(
    attendanceBulkSchema.safeParse({
      params: { id: 'invalid' },
      body: {
        records: [
          {
            studentId: '00000000-0000-4000-8000-000000000002',
            status: 'PRESENT',
          },
        ],
      },
    }).success,
    false
  );
});

test('attendance administrators can access all school classes', async () => {
  assert.equal(
    await getTeacherAttendanceClassIds(
      { tenantId: 'tenant', schoolId: 'school', actorId: 'admin', roles: ['SCHOOL_ADMIN'] },
      {}
    ),
    null
  );
});

test('teacher attendance access is the union of class and teaching assignments', async () => {
  const database = {
    teacher: { findFirst: async () => ({ id: 'teacher' }) },
    classTeacher: { findMany: async () => [{ classId: 'blue' }] },
    teacherTeachingAssignment: {
      findMany: async () => [{ classId: 'blue' }, { classId: 'gold' }],
    },
  };
  const context = {
    tenantId: 'tenant',
    schoolId: 'school',
    actorId: 'user',
    roles: ['TEACHER'],
  };
  assert.deepEqual(await getTeacherAttendanceClassIds(context, database), ['blue', 'gold']);
  await assert.doesNotReject(assertAttendanceClassAccess(context, 'gold', database));
  await assert.rejects(
    assertAttendanceClassAccess(context, 'unassigned', database),
    (error) => error?.statusCode === 403
  );
});

test('attendance creation records the authenticated actor and UI uses assigned selectors', async () => {
  const [service, controller, routes, dashboard] = await Promise.all([
    readFile(
      new URL('../../src/application/services/attendanceService.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/presentation/http/controllers/attendanceController.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/presentation/http/routes/attendanceRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../frontend/src/AttendanceDashboard.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(controller, /actorId: req\.user\.id/);
  assert.match(service, /createdById: actorId/);
  assert.match(routes, /router\.get\('\/options', controller\.options\)/);
  assert.match(routes, /validate\(attendanceSessionIdSchema\)/);
  assert.match(dashboard, /api\.get\('\/attendance\/options'\)/);
  assert.doesNotMatch(dashboard, /School UUID|Class UUID|x-school-id/);
});
