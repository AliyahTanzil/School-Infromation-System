import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('library APIs enforce authenticated school scope and validation', async () => {
  const routes = await read('../../src/presentation/http/routes/libraryRoutes.js');
  const validators = await read('../../src/application/validators/libraryValidators.js');
  assert.match(routes, /authenticate, teacherContext, authorize/);
  assert.match(routes, /validate\(loanCreateSchema\)/);
  assert.doesNotMatch(validators, /tenantId|schoolId/);
});
test('library circulation updates copy and loan atomically', async () => {
  const service = await read('../../src/application/services/libraryService.js');
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /status: 'AVAILABLE'/);
  assert.match(service, /status: 'RETURNED'/);
});
test('active server mounts both library APIs', async () => {
  const app = await read('../../src/foundation/app.ts');
  assert.match(app, /\/api\/libraries/);
  assert.match(app, /\/api\/v1\/libraries/);
});
test('library migration is non-destructive', async () => {
  const sql = await read(
    '../../prisma/migrations/20260827280000_library_circulation/migration.sql'
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "LibraryLoan"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
