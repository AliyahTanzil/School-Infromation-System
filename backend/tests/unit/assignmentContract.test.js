import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('assignments relate to digital classrooms, authors and optional subjects', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model Assignment \{/);
  assert.match(schema, /classroom\s+DigitalClassroom\s+@relation/);
  assert.match(schema, /author\s+User\s+@relation/);
  assert.match(schema, /subject\s+Subject\?\s+@relation/);
  assert.match(schema, /publishedAt\s+DateTime\?/);
  assert.match(schema, /closedAt\s+DateTime\?/);
});

test('assignment service enforces membership, teacher management and forward lifecycle', async () => {
  const service = await read('src/application/services/assignmentService.js');
  assert.match(service, /digitalClassroom\.findFirst/);
  assert.match(service, /Only classroom teachers can manage classwork/);
  assert.match(service, /DRAFT: \['PUBLISHED', 'ARCHIVED'\]/);
  assert.match(service, /PUBLISHED: \['CLOSED', 'ARCHIVED'\]/);
  assert.match(service, /Due date must be after the availability date/);
});

test('assignment routes permit member reads but protect validated mutations', async () => {
  const routes = await read('src/presentation/http/routes/assignmentRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /router\.get\('\/', validate\(assignmentQuerySchema\)/);
  assert.match(routes, /authorizeSchoolAdminOrTeacher/);
  assert.match(routes, /validate\(assignmentCreateSchema\)/);
  assert.match(routes, /validate\(assignmentStatusSchema\)/);
  assert.match(app, /app\.use\('\/api\/lms\/assignments', assignmentRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/assignments', assignmentRouter\)/);
});

test('assignment migration is checked in and non-destructive', async () => {
  const migration = await read(
    'prisma/migrations/20260827340000_assignment_lifecycle/migration.sql'
  );
  assert.match(migration, /CREATE TABLE "Assignment"/);
  assert.match(migration, /REFERENCES "DigitalClassroom"/);
  assert.match(migration, /REFERENCES "Subject"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('classroom frontend loads, creates and advances persisted assignments', async () => {
  const frontend = await read('../frontend/src/ClassroomDashboard.jsx');
  assert.match(frontend, /api\.get\('\/lms\/assignments'/);
  assert.match(frontend, /api\.post\(\s*'\/lms\/assignments'/);
  assert.match(frontend, /changeAssignmentStatus/);
  assert.match(frontend, /PUBLISHED/);
  assert.match(frontend, /CLOSED/);
});
