import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
test('transport routes enforce school scope and validation', async () => {
  const r = await read('../../src/presentation/http/routes/transportRoutes.js');
  const v = await read('../../src/application/validators/transportValidators.js');
  assert.match(r, /authenticate, teacherContext, authorize/);
  assert.match(r, /validate\(tripSchema\)/);
  assert.doesNotMatch(v, /tenantId|schoolId/);
});
test('transport queries are tenant and school scoped', async () => {
  const s = await read('../../src/application/services/transportService.js');
  assert.match(s, /tenantId, schoolId/);
  assert.doesNotMatch(s, /include: \{ type: true \}/);
});
test('active server mounts transport APIs', async () => {
  const a = await read('../../src/foundation/app.ts');
  assert.match(a, /\/api\/transport/);
  assert.match(a, /\/api\/v1\/transport/);
});
test('transport migration is non-destructive', async () => {
  const sql = await read(
    '../../prisma/migrations/20260827300000_transport_operations/migration.sql'
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "TransportTrip"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('transport dashboard uses operational APIs without seeded fleet data', async () => {
  const page = await read('../../../frontend/src/TransportDashboard.jsx');
  assert.match(page, /\/transport\/vehicles/);
  assert.match(page, /\/transport\/drivers/);
  assert.match(page, /\/transport\/trips/);
  assert.doesNotMatch(page, /BUS-001|RT-NORTH|fallback data/);
});
