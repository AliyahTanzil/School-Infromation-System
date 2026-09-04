import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requireTenantContext,
  requirePlatformOwner,
} from '../../src/middleware/auth/authorization.js';
import AuthorizationError from '../../src/shared/errors/AuthorizationError.js';

test('single-school context ignores client tenant selectors', () => {
  const req = {
    user: { tenantId: 'tenant-a', schoolId: 'school-1' },
    auth: {},
    get: () => 'tenant-b',
    params: {},
    query: {},
  };
  requireTenantContext(req, {}, () => {});
  assert.equal(req.auth.schoolId, 'school-1');
});

test('tenant context resolves the authenticated school scope', () => {
  const req = {
    user: { tenantId: 'tenant-a', schoolId: 'school-1' },
    auth: {},
    get: () => '',
    params: {},
    query: {},
  };
  requireTenantContext(req, {}, () => {});
  assert.equal(req.auth.schoolId, 'school-1');
});

test('platform guard rejects platform access in single-school mode', () => {
  const req = { user: { roles: ['OWNER'], schoolId: 'school-1' } };
  assert.throws(
    () => requirePlatformOwner(req, {}, () => {}),
    (error) => error instanceof AuthorizationError && error.code === 'PLATFORM_ACCESS_DISABLED'
  );
});
