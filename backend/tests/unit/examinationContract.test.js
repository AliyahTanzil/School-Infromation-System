import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('examination routes require authenticated school context and validation', async () => {
  const routes = await read('../../src/presentation/http/routes/examinationRoutes.js');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /validate\(examinationCreateSchema\)/);
  assert.match(routes, /validate\(examinationMarkSchema\)/);
});
test('active server mounts versioned and compatibility examination APIs', async () => {
  const app = await read('../../src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/examinations', examinationRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/examinations', examinationRouter\)/);
});
test('examination persistence has a checked-in non-destructive migration', async () => {
  const migration = await read(
    '../../prisma/migrations/20260827210000_examination_workflow/migration.sql'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "Examination"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
