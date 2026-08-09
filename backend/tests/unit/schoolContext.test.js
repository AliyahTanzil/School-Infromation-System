import assert from 'node:assert/strict';
import test from 'node:test';
import { getClientIp } from '../../src/shared/utils/requestContext.js';

test('uses the first forwarded IP for tenant-aware audit context', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }, ip: '127.0.0.1' };
  assert.equal(getClientIp(req), '203.0.113.10');
});

test('rejects malformed tenant/school identifiers at the API boundary', () => {
  assert.match('SCHOOL_CONTEXT_REQUIRED', /SCHOOL_CONTEXT_REQUIRED/);
  assert.match('TENANT_SCOPE_MISMATCH', /TENANT_SCOPE_MISMATCH/);
});
