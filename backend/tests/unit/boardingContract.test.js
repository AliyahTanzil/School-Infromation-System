import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
test('boarding routes enforce school scope and validation', async () => {
  const r = await read('../../src/presentation/http/routes/boardingRoutes.js');
  const v = await read('../../src/application/validators/boardingValidators.js');
  assert.match(r, /authenticate, teacherContext, authorize/);
  assert.match(r, /validate\(allocationSchema\)/);
  assert.doesNotMatch(v, /tenantId|schoolId/);
});
test('boarding allocations and checkout are atomic', async () => {
  const s = await read('../../src/application/services/boardingService.js');
  assert.match(s, /prisma\.\$transaction/);
  assert.match(s, /status: 'OCCUPIED'/);
  assert.match(s, /status: 'AVAILABLE'/);
});
test('active server mounts boarding APIs', async () => {
  const a = await read('../../src/foundation/app.ts');
  assert.match(a, /\/api\/boarding/);
  assert.match(a, /\/api\/v1\/boarding/);
});
test('boarding migration is non-destructive', async () => {
  const sql = await read('../../prisma/migrations/20260827310000_boarding_lifecycle/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "BoardingAllocation"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('boarding dashboard uses operational APIs without static statistics', async () => {
  const page = await read('../../../frontend/src/BoardingDashboard.jsx');
  assert.match(page, /\/boarding\/dormitories/);
  assert.match(page, /\/boarding\/applications/);
  assert.match(page, /\/boarding\/allocations/);
  assert.doesNotMatch(page, /148|Room inspections|Safety signals/);
});
