import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('live sessions relate to digital classrooms and hosts', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model ClassroomLiveSession \{/);
  assert.match(schema, /classroom\s+DigitalClassroom\s+@relation/);
  assert.match(schema, /host\s+User\s+@relation/);
  assert.match(schema, /status\s+String\s+@default\("SCHEDULED"\)/);
  assert.match(schema, /meetingUrl\s+String\?/);
  assert.match(schema, /recordingUrl\s+String\?/);
});

test('live session service enforces membership, teacher management, and status transitions', async () => {
  const service = await read('src/application/services/classroomLiveSessionService.js');
  assert.match(service, /digitalClassroom\.findFirst/);
  assert.match(service, /Only classroom teachers can manage live sessions/);
  assert.match(service, /SCHEDULED: \['LIVE', 'CANCELLED'\]/);
  assert.match(service, /LIVE: \['ENDED', 'CANCELLED'\]/);
  assert.match(service, /LMS_LIVE_SESSION_SCHEDULED/);
  assert.match(service, /LMS_LIVE_SESSION_STARTED/);
});

test('live session routes permit member reads and protect teacher/admin mutations', async () => {
  const routes = await read('src/presentation/http/routes/classroomLiveSessionRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /router\.get\('\/', validate\(liveSessionQuerySchema\)/);
  assert.match(routes, /router\.get\('\/recordings'/);
  assert.match(routes, /authorizeSchoolAdminOrTeacher/);
  assert.match(routes, /validate\(liveSessionCreateSchema\)/);
  assert.match(routes, /validate\(liveSessionStatusSchema\)/);
  assert.match(app, /app\.use\('\/api\/lms\/live-sessions', classroomLiveSessionRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/live-sessions', classroomLiveSessionRouter\)/);
});

test('live session migration is checked in and non-destructive', async () => {
  const migration = await read(
    'prisma/migrations/20260905100000_classroom_live_sessions/migration.sql'
  );
  assert.match(migration, /CREATE TABLE "ClassroomLiveSession"/);
  assert.match(migration, /REFERENCES "DigitalClassroom"/);
  assert.match(migration, /REFERENCES "User"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('live learning workspace loads live sessions and recordings from API', async () => {
  const frontend = await read('../frontend/src/LiveLearningWorkspace.jsx');
  assert.match(frontend, /api\.get\('\/lms\/live-sessions'/);
  assert.match(frontend, /api\.get\('\/lms\/live-sessions\/recordings'/);
});
