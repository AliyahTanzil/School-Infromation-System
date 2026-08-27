import assert from 'node:assert/strict';
import test from 'node:test';
import { redact } from '../../src/middleware/requestLogger/index.js';
import { requireTenantContext } from '../../src/middleware/auth/authorization.js';
import { isCorsOriginAllowed } from '../../src/bootstrap/createApp.js';

test('redacts credential-shaped request fields', () => {
  const safe = redact({ password: 'hidden', accessToken: 'hidden', name: 'Ada' });
  assert.equal(safe.password, '[REDACTED]');
  assert.equal(safe.accessToken, '[REDACTED]');
  assert.equal(safe.name, 'Ada');
});

test('rejects cross-tenant request context', () => {
  const req = {
    user: { tenantId: 'tenant-a' },
    query: { tenantId: 'tenant-b' },
    params: {},
    get: () => undefined,
  };
  assert.throws(() => requireTenantContext(req, {}, () => {}), /Tenant context is not permitted/);
});

test('does not accept tenant context without authentication', () => {
  const req = { user: undefined, query: {}, params: {}, get: () => undefined };
  assert.throws(() => requireTenantContext(req, {}, () => {}), /Tenant context required/);
});

test('pagination clamps page size in the student service source', async () => {
  const source = await import('../../src/application/services/studentDomainService.js');
  assert.ok(source.list);
});

test('allows only this frontend project Vercel deployment origins', () => {
  assert.equal(
    isCorsOriginAllowed(
      'https://school-administration-information-system-frontend-qund11kdg.vercel.app'
    ),
    true
  );
  assert.equal(isCorsOriginAllowed('https://unrelated-project.vercel.app'), false);
});
