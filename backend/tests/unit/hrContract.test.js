import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('HR routes enforce authenticated school administration context and validation', async () => {
  const routes = await read('../../src/presentation/http/routes/hrRoutes.js');
  const validators = await read('../../src/application/validators/hrValidators.js');
  assert.match(routes, /authenticate, teacherContext, hrAdmin/);
  assert.match(routes, /validate\(employeeCreateSchema\)/);
  assert.match(routes, /validate\(leaveDecisionSchema\)/);
  assert.match(routes, /validate\(payrollCreateSchema\)/);
  assert.doesNotMatch(validators, /tenantId|schoolId/);
});

test('HR ownership is derived separately from request bodies', async () => {
  const controller = await read('../../src/presentation/http/controllers/hrController.js');
  const service = await read('../../src/application/services/hrService.js');
  assert.match(controller, /createEmployee\(context\(req\), req\.body\)/);
  assert.match(service, /scope\(context\)/);
  assert.doesNotMatch(service, /\{ tenantId, schoolId, \.\.\.data \}/);
});

test('active server mounts compatibility and versioned HR APIs', async () => {
  const app = await read('../../src/foundation/app.ts');
  assert.match(app, /\/api\/hr/);
  assert.match(app, /\/api\/v1\/hr/);
});

test('HR migration is checked in and non-destructive', async () => {
  const sql = await read('../../prisma/migrations/20260827270000_hr_vertical_slice/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "Employee"/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "PayrollItem"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('HR dashboard uses operational API workflows', async () => {
  const page = await read('../../../frontend/src/HRDashboard.jsx');
  assert.match(page, /\/hr\/employees/);
  assert.match(page, /\/hr\/leave-requests/);
  assert.match(page, /\/hr\/payroll-runs/);
});
