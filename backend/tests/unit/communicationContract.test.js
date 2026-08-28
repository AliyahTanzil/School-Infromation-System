import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('communication endpoints use authenticated school and user context', async () => {
  const routes = await read('../../src/presentation/http/routes/communicationRoutes.js');
  const validators = await read('../../src/application/validators/communicationValidators.js');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /req\.user\.id/);
  assert.doesNotMatch(validators, /tenantId|schoolId/);
});
test('active server mounts communication compatibility and versioned APIs', async () => {
  const app = await read('../../src/foundation/app.ts');
  assert.match(app, /\/api\/communication/);
  assert.match(app, /\/api\/v1\/communication/);
});
test('notification delivery migration is non-destructive', async () => {
  const sql = await read(
    '../../prisma/migrations/20260827260000_notification_delivery/migration.sql'
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "NotificationEvent"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('notification center uses persisted inbox and preference contracts', async () => {
  const page = await read('../../../frontend/src/NotificationCenter.jsx');
  assert.match(page, /\/communication\/inbox/);
  assert.match(page, /\/communication\/notification-preferences/);
  assert.match(page, /\/communication\/notifications\/\$\{delivery\.eventId\}\/read/);
  assert.doesNotMatch(page, /seedNotifications|98\.7|12,842/);
});
