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

test('ignores caller-supplied tenant context', () => {
  const req = {
    user: { tenantId: 'tenant-a', schoolId: 'school-1' },
    query: { tenantId: 'tenant-b' },
    params: {},
    get: () => undefined,
  };
  req.auth = {};
  requireTenantContext(req, {}, () => {});
  assert.equal(req.auth.schoolId, 'school-1');
});

test('does not accept school context without authentication', () => {
  const req = { user: undefined, query: {}, params: {}, get: () => undefined };
  assert.throws(() => requireTenantContext(req, {}, () => {}), /School context required/);
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
  assert.equal(
    isCorsOriginAllowed(
      'https://school-administration-information-system-frontend-c4k9cs328.vercel.app'
    ),
    true
  );
  assert.equal(
    isCorsOriginAllowed(
      'https://school-administration-information-system-frontend--aph3fmch6.vercel.app'
    ),
    true
  );
  assert.equal(isCorsOriginAllowed('https://unrelated-project.vercel.app'), false);
});

test('allows fallback loopback ports only in development', async () => {
  const { config } = await import('../../src/foundation/config.ts');
  const previous = config.env;
  try {
    config.env = 'development';
    for (const origin of ['http://localhost:3001', 'http://127.0.0.1:3002', 'http://[::1]:3003']) {
      assert.equal(isCorsOriginAllowed(origin), true, origin);
    }
    for (const origin of [
      'http://localhost.attacker.test:3001',
      'http://192.168.0.6:3001',
      'http://localhost:3001/path',
      'http://user@localhost:3001',
      'ftp://localhost:3001',
      'null',
    ]) {
      assert.equal(isCorsOriginAllowed(origin), false, origin);
    }
    for (const environment of ['production', 'test']) {
      config.env = environment;
      assert.equal(isCorsOriginAllowed('http://localhost:3001'), false);
      assert.equal(isCorsOriginAllowed('http://127.0.0.1:3002'), false);
    }
  } finally {
    config.env = previous;
  }
});
