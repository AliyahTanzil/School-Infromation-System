import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('result processing maps candidates to real student identifiers', async () => {
  const source = await read('../../src/application/services/resultService.js');
  assert.match(source, /studentId: candidate\.studentId/);
  assert.match(source, /status !== 'LOCKED'/);
});
test('results use authenticated school context on both server mounts', async () => {
  const routes = await read('../../src/presentation/http/routes/resultRoutes.js');
  const app = await read('../../src/foundation/app.ts');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(app, /\/api\/v1\/results/);
});
test('teachers can read results but only administrators can process or publish them', async () => {
  const routes = await read('../../src/presentation/http/routes/resultRoutes.js');
  assert.match(
    routes,
    /const readResults = authorize\('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'\)/
  );
  assert.match(routes, /const administerResults = authorize\('PLATFORM_ADMIN', 'SCHOOL_ADMIN'\)/);
  assert.match(routes, /router\.get\('\/', readResults/);
  assert.match(routes, /router\.post\('\/process', administerResults/);
  assert.match(routes, /'\/:id\/status',[\s\S]*?administerResults,/);
});
test('result workflow has a non-destructive migration', async () => {
  const sql = await read('../../prisma/migrations/20260827220000_result_workflow/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "Result"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE/i);
});
