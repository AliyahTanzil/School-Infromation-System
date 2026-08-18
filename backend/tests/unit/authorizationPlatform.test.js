import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requireTenantContext,
  requirePlatformOwner,
} from '../../src/middleware/auth/authorization.js';
import AuthorizationError from '../../src/shared/errors/AuthorizationError.js';

test('tenant context pins regular users to their own tenant', () => {
  const req = {
    user: { tenantId: 'tenant-a' },
    auth: {},
    get: () => 'tenant-b',
    params: {},
    query: {},
  };
  assert.throws(
    () => requireTenantContext(req, {}, () => {}),
    (error) => error instanceof AuthorizationError && error.code === 'TENANT_CONTEXT_FORBIDDEN'
  );
});

test('tenant context resolves the authenticated tenant', () => {
  const req = { user: { tenantId: 'tenant-a' }, auth: {}, get: () => '', params: {}, query: {} };
  requireTenantContext(req, {}, () => {});
  assert.equal(req.auth.tenantId, 'tenant-a');
});

test('platform owner guard rejects user-supplied role claims', () => {
  const req = { user: { roles: ['OWNER'] } };
  assert.throws(
    () => requirePlatformOwner(req, {}, () => {}),
    (error) => error instanceof AuthorizationError && error.code === 'PLATFORM_OWNER_REQUIRED'
  );
});
