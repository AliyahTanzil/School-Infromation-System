import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canTransitionTimetable,
  detectTimetableConflicts,
} from '../../src/domain/timetableEngine.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('timetable routes require authenticated school context on both active mounts', async () => {
  const routes = await read('../../src/presentation/http/routes/timetableRoutes.js');
  const app = await read('../../src/foundation/app.ts');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(app, /app\.use\('\/api\/timetables', timetableRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/timetables', timetableRouter\)/);
});
test('timetable workflow has a non-destructive migration', async () => {
  const sql = await read('../../prisma/migrations/20260827230000_timetable_workflow/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "Timetable"/);
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
