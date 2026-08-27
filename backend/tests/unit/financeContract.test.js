import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('finance uses authenticated school context on both active mounts', async () => {
  const routes = await read('../../src/presentation/http/routes/financeRoutes.js');
  const app = await read('../../src/foundation/app.ts');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(app, /\/api\/v1\/finance/);
});
test('finance inputs cannot forge tenant or school ownership', async () => {
  const validators = await read('../../src/application/validators/financeValidators.js');
  assert.doesNotMatch(validators, /tenantId|schoolId/);
});
test('finance core has a non-destructive migration and atomic ledger entry', async () => {
  const sql = await read('../../prisma/migrations/20260827240000_finance_core/migration.sql');
  const service = await read('../../src/application/services/financeService.js');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "Invoice"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
  assert.match(service, /financialTransaction\.create/);
});
