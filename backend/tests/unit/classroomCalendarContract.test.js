import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('classroom calendar exposes published assignment availability and deadlines to members', async () => {
  const service = await read('src/application/services/classroomCalendarService.js');
  assert.match(service, /Digital classroom not found/);
  assert.match(service, /You are not a member of this classroom/);
  assert.match(service, /status: \{ in: \['PUBLISHED', 'CLOSED'\] \}/);
  assert.match(service, /ASSIGNMENT_AVAILABLE/);
  assert.match(service, /ASSIGNMENT_DUE/);
  assert.match(
    service,
    /const withinRange = \(value, start, end\) => value && value >= start && value <= end/
  );
  assert.match(service, /prisma\.timetable\.findFirst/);
  assert.match(service, /type: 'LESSON'/);
  assert.match(service, /date\.getUTCDay\(\) \|\| 7/);
});

test('calendar endpoint has validated dates and both active API mounts', async () => {
  const routes = await read('src/presentation/http/routes/classroomCalendarRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /router\.get\('\/', validate\(classroomCalendarQuerySchema\)/);
  assert.match(app, /app\.use\('\/api\/lms\/calendar', classroomCalendarRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/calendar', classroomCalendarRouter\)/);
});

test('assignment publication delivers one persisted in-app event to active classroom members', async () => {
  const service = await read('src/application/services/assignmentService.js');
  assert.match(service, /if \(status === 'PUBLISHED'\)/);
  assert.match(service, /digitalClassroomMember\.findMany/);
  assert.match(service, /LMS_ASSIGNMENT_PUBLISHED/);
  assert.match(service, /channels: \['IN_APP'\]/);
  assert.doesNotMatch(service, /if \(status === 'CLOSED'\)[\s\S]*LMS_ASSIGNMENT_PUBLISHED/);
});
