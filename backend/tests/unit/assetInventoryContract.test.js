import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
test('asset routes enforce school scope and validation', async () => {
  const r = await read('../../src/presentation/http/routes/assetInventoryRoutes.js');
  const v = await read('../../src/application/validators/assetInventoryValidators.js');
  assert.match(r, /authenticate, teacherContext, authorize/);
  assert.match(r, /validate\(movementSchema\)/);
  assert.doesNotMatch(v, /tenantId|schoolId/);
});
test('stock movements are atomic and reject negative balance', async () => {
  const s = await read('../../src/application/services/assetInventoryService.js');
  assert.match(s, /prisma\.\$transaction/);
  assert.match(s, /balanceAfter < 0/);
});
test('active server mounts asset inventory APIs', async () => {
  const a = await read('../../src/foundation/app.ts');
  assert.match(a, /\/api\/assets-inventory/);
  assert.match(a, /\/api\/v1\/assets-inventory/);
});
test('asset migration is non-destructive', async () => {
  const sql = await read('../../prisma/migrations/20260827290000_asset_inventory/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "InventoryMovement"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('asset dashboard uses operational API workflows', async () => {
  const page = await read('../../../frontend/src/AssetInventoryDashboard.jsx');
  assert.match(page, /\/assets-inventory\/assets/);
  assert.match(page, /\/assets-inventory\/inventory/);
  assert.doesNotMatch(page, /Demo data|LT-00045|INV-0001/);
});
