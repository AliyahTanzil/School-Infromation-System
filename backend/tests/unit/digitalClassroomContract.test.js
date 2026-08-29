import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('digital classroom persistence is distinct from physical rooms', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model DigitalClassroom \{/);
  assert.match(schema, /model DigitalClassroomMember \{/);
  assert.match(schema, /@@unique\(\[tenantId, schoolId, code\]\)/);
  assert.match(schema, /@@id\(\[classroomId, userId\]\)/);
});

test('classroom APIs derive tenant and school ownership from authenticated context', async () => {
  const routes = await read('src/presentation/http/routes/digitalClassroomRoutes.js');
  const controller = await read('src/presentation/http/controllers/digitalClassroomController.js');
  const service = await read('src/application/services/digitalClassroomService.js');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /validate\(classroomCreateSchema\)/);
  assert.match(controller, /req\.schoolContext\.tenantId/);
  assert.match(controller, /req\.schoolContext\.schoolId/);
  assert.match(service, /digitalClassroom\.findMany/);
  assert.match(service, /memberships: \{ some:/);
  assert.match(service, /user\.findFirst/);
});

test('classroom membership and archival operations are exposed on both active mounts', async () => {
  const routes = await read('src/presentation/http/routes/digitalClassroomRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /post\('\/:classroomId\/members'/);
  assert.match(routes, /'\/:classroomId\/members\/:userId'/);
  assert.match(routes, /patch\('\/:classroomId\/archive'/);
  assert.match(app, /app\.use\('\/api\/lms\/classrooms', digitalClassroomRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/classrooms', digitalClassroomRouter\)/);
});

test('digital classroom migration is checked in and non-destructive', async () => {
  const migration = await read(
    'prisma/migrations/20260827320000_digital_classroom_foundation/migration.sql'
  );
  assert.match(migration, /CREATE TABLE "DigitalClassroom"/);
  assert.match(migration, /CREATE TABLE "DigitalClassroomMember"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('classroom dashboard uses operational APIs and contains no seeded classroom roster', async () => {
  const frontend = await read('../frontend/src/ClassroomDashboard.jsx');
  assert.match(frontend, /api\.get\('\/lms\/classrooms'/);
  assert.match(frontend, /api\.post\(/);
  assert.match(frontend, /\/members`/);
  assert.doesNotMatch(frontend, /initialClassrooms|Ms\. Sesay|MTH-8A',\s*students/);
});
