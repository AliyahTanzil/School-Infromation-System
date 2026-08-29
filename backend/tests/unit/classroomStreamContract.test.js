import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('stream records belong to the digital classroom foundation', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /classroom\s+DigitalClassroom\s+@relation/);
  assert.match(schema, /comments\s+ClassroomStreamComment\[\]/);
  assert.match(schema, /author\s+User\s+@relation/);
});

test('stream service enforces active classroom membership and teacher announcements', async () => {
  const service = await read('src/application/services/classroomStreamService.js');
  assert.match(service, /digitalClassroom\.findFirst/);
  assert.match(service, /memberships: \{ where: \{ userId, status: 'ACTIVE' \} \}/);
  assert.match(service, /Only classroom teachers can publish announcements/);
  assert.match(service, /classroomAnnouncement\.create/);
  assert.match(service, /classroomStreamPost\.create/);
  assert.match(service, /classroomStreamComment\.create/);
});

test('validated stream APIs are mounted on both active server paths', async () => {
  const routes = await read('src/presentation/http/routes/classroomStreamRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /validate\(announcementSchema\)/);
  assert.match(routes, /validate\(postSchema\)/);
  assert.match(routes, /validate\(commentSchema\)/);
  assert.match(app, /app\.use\('\/api\/lms\/classroom-stream', classroomStreamRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/classroom-stream', classroomStreamRouter\)/);
});

test('stream migration is checked in and non-destructive', async () => {
  const migration = await read('prisma/migrations/20260827330000_classroom_stream/migration.sql');
  assert.match(migration, /CREATE TABLE "ClassroomAnnouncement"/);
  assert.match(migration, /CREATE TABLE "ClassroomStreamPost"/);
  assert.match(migration, /CREATE TABLE "ClassroomStreamComment"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('classroom frontend loads and publishes real stream data', async () => {
  const frontend = await read('../frontend/src/ClassroomDashboard.jsx');
  assert.match(frontend, /api\.get\(`\/lms\/classroom-stream\/\$\{id\}`/);
  assert.match(frontend, /\/announcements`/);
  assert.match(frontend, /\/posts`/);
  assert.doesNotMatch(frontend, /initialClasswork|initialTopics|initialSubmissions/);
});
