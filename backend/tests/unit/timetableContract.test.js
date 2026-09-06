import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import {
  canTransitionTimetable,
  detectTimetableConflicts,
} from '../../src/domain/timetableEngine.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('timetable routes require authenticated school context on both active mounts', async () => {
  const routes = await read('../../src/presentation/http/routes/timetableRoutes.js');
  const app = await read('../../src/foundation/app.ts');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /authorize\('PLATFORM_ADMIN', 'SCHOOL_ADMIN'\)/);
  for (const [method, suffix, schema, handler] of [
    ['get', '', 'teacherAvailabilityListSchema', 'listTeacherAvailability'],
    ['post', '', 'teacherAvailabilitySchema', 'createTeacherAvailability'],
    ['patch', '/:id', 'teacherAvailabilityUpdateSchema', 'updateTeacherAvailability'],
    ['delete', '/:id', 'teacherAvailabilityIdSchema', 'removeTeacherAvailability'],
  ]) {
    const routePattern = new RegExp(
      `router\\.${method}\\(\\s*'/teachers/:teacherId/availability${suffix.replace('/', '\\/')}',\\s*validate\\(${schema}\\),\\s*controller\\.${handler}\\s*\\);`
    );
    assert.match(routes, routePattern);
  }
  assert.match(app, /app\.use\('\/api\/v1\/timetables', timetableRouter\)/);
  assert.match(routes, /router\.post\('\/:id\/generate-slots', controller\.generateSlots\)/);
  assert.match(routes, /router\.post\('\/:id\/generate-schedule', controller\.generateSchedule\)/);
  const service = await read('../../src/application/services/timetableService.js');
  assert.match(service, /export async function generateCompleteSchedule/);
  assert.match(service, /Automatic generation requires an empty timetable draft/);
  assert.match(service, /Timetable is not feasible/);
  assert.match(app, /app\.use\('\/api\/timetables', timetableRouter\)/);
  assert.match(
    routes,
    /router\.post\(\s*'\/teaching-assignments',[\s\S]*?controller\.createTeachingAssignment\s*\)/
  );
  assert.match(
    routes,
    /router\.get\(\s*'\/teachers\/:teacherId\/workload',[\s\S]*?controller\.teacherWorkload\s*\)\s*;/
  );
});
test('timetable workflow has a non-destructive migration', async () => {
  const sql = await read('../../prisma/migrations/20260827230000_timetable_workflow/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "Timetable"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('timetable domain reconciliation adds settings, assignments, requirements and rooms', async () => {
  const schema = await read('../../prisma/schema.prisma');
  const sql = await read(
    '../../prisma/migrations/20260906100000_timetable_domain_reconciliation/migration.sql'
  );
  for (const model of [
    'model TimetableSettings',
    'model TimetableRoom',
    'model TeacherTeachingAssignment',
    'model SubjectPeriodRequirement',
  ]) {
    assert.match(schema, new RegExp(model));
  }
  assert.match(schema, /@@unique\(\[timetableId, timeSlotId, classId\]\)/);
  assert.match(schema, /@@unique\(\[timetableId, timeSlotId, teacherId\]\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "TimetableSettings"/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "TeacherTeachingAssignment"/);
  assert.match(sql, /ScheduleEntry_teacher_slot_key/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('conflicts block publication and overlapping teacher assignments are detected', () => {
  const slots = [{ id: 'slot-1' }];
  const entries = [
    { id: 'a', timeSlotId: 'slot-1', teacherId: 't1' },
    { id: 'b', timeSlotId: 'slot-1', teacherId: 't1' },
  ];
  const conflicts = detectTimetableConflicts(entries, slots);
  assert.equal(conflicts[0].code, 'TEACHER_OVERLAP');
  assert.throws(() => canTransitionTimetable('REVIEW', 'PUBLISHED', conflicts));
});
