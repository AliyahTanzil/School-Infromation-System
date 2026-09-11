import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('digital materials belong to classrooms and uploaders', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model DigitalMaterial[\s\S]*classroom\s+DigitalClassroom/);
  assert.match(schema, /model DigitalMaterial[\s\S]*uploader\s+User/);
});

test('material routes authenticate, resolve school context and validate requests', async () => {
  const routes = await read('src/presentation/http/routes/materialRoutes.js');
  assert.match(routes, /router\.use\(authenticate, teacherContext\)/);
  assert.match(routes, /validate\(materialListSchema\)/);
  assert.match(routes, /authorizeSchoolAdminOrTeacher/);
});

test('material access is constrained by active classroom membership', async () => {
  const service = await read('src/application/services/materialService.js');
  assert.match(service, /digitalClassroom\.findFirst/);
  assert.match(service, /You are not a member of this classroom/);
  assert.match(service, /Only classroom teachers can upload materials/);
});

test('material routes are mounted on both active LMS API paths', async () => {
  const app = await read('src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/lms\/materials', materialRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/materials', materialRouter\)/);
});

test('digital material migration is checked in and non-destructive', async () => {
  const migration = await read(
    'prisma/migrations/20260827350000_digital_material_repository/migration.sql'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "DigitalMaterial"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/);
});
