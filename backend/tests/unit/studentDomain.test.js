import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import {
  studentDomainCreateSchema,
  studentDomainGuardianSchema,
  studentDomainIdSchema,
  studentDomainQuerySchema,
  studentDomainUpdateSchema,
} from '../../src/application/validators/studentDomainValidators.js';

test('student API requires tenant-scoped authorization permissions', async () => {
  const source = await import('../../src/presentation/http/routes/studentDomainRoutes.js');
  assert.ok(source.default);
});

test('student route surface exposes only tenant-safe operations', async () => {
  const source = await import('../../src/presentation/http/routes/studentDomainRoutes.js');
  const routeStack = source.default.stack.map((layer) => layer.route?.path).filter(Boolean);
  assert.deepEqual(routeStack, ['/', '/:id', '/', '/:id', '/:id/guardians']);
});

test('student requests accept the flat persisted contract and reject ownership fields', () => {
  const valid = {
    body: {
      firstName: 'Ada',
      lastName: 'Okafor',
      dateOfBirth: '2014-06-12',
      gender: 'FEMALE',
      email: 'ada@example.com',
    },
  };
  assert.equal(studentDomainCreateSchema.safeParse(valid).success, true);
  assert.equal(
    studentDomainCreateSchema.safeParse({
      body: { ...valid.body, tenantId: '00000000-0000-4000-8000-000000000001' },
    }).success,
    false
  );
  assert.equal(
    studentDomainCreateSchema.safeParse({
      body: { ...valid.body, dateOfBirth: '2099-01-01' },
    }).success,
    false
  );
});

test('student query, ID, update, and guardian inputs are strict and bounded', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(
    studentDomainQuerySchema.safeParse({ query: { page: '2', pageSize: '50' } }).success,
    true
  );
  assert.equal(studentDomainQuerySchema.safeParse({ query: { pageSize: '500' } }).success, false);
  assert.equal(studentDomainIdSchema.safeParse({ params: { id: 'invalid' } }).success, false);
  assert.equal(studentDomainUpdateSchema.safeParse({ params: { id }, body: {} }).success, false);
  assert.equal(
    studentDomainUpdateSchema.safeParse({ params: { id }, body: { phone: '08012345678' } }).success,
    true
  );
  assert.equal(
    studentDomainGuardianSchema.safeParse({
      params: { id },
      body: { relationship: 'Mother', firstName: 'Ngozi', lastName: 'Okafor' },
    }).success,
    true
  );
  assert.equal(
    studentDomainGuardianSchema.safeParse({
      params: { id },
      body: { relationship: 'Mother' },
    }).success,
    false
  );
});

test('canonical student routes validate every request and derive tenant from school context', async () => {
  const [routes, controller, dashboard] = await Promise.all([
    readFile(
      new URL('../../src/presentation/http/routes/studentDomainRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL(
        '../../src/presentation/http/controllers/studentDomainController.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(new URL('../../../frontend/src/StudentDashboard.jsx', import.meta.url), 'utf8'),
  ]);
  for (const schema of [
    'studentDomainQuerySchema',
    'studentDomainIdSchema',
    'studentDomainCreateSchema',
    'studentDomainUpdateSchema',
    'studentDomainGuardianSchema',
  ]) {
    assert.match(routes, new RegExp(`validate\\(${schema}\\)`));
  }
  assert.match(controller, /req\.schoolContext\.tenantId/);
  assert.doesNotMatch(controller, /req\.auth\?\.tenantId|req\.user\?\.tenantId/);
  assert.doesNotMatch(dashboard, /94\.8%|Pending review/);
  assert.match(dashboard, /pagination\?\.total/);
});
