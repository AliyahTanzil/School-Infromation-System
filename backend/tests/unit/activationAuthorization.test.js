import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import requireApplicationOwner from '../../src/middleware/auth/requireApplicationOwner.js';
import { activationDecisionSchema } from '../../src/application/validators/activationValidators.js';

test('activation routes require the authenticated application owner', () => {
  const next = () => {};
  assert.throws(
    () =>
      requireApplicationOwner(
        { user: { accountType: 'TENANT_ADMIN', platformRole: null } },
        {},
        next
      ),
    (error) => error?.statusCode === 403 && error?.code === 'APPLICATION_OWNER_REQUIRED'
  );
  assert.throws(
    () =>
      requireApplicationOwner(
        { user: { accountType: 'APPLICATION_MANAGER', platformRole: null } },
        {},
        next
      ),
    /Only the application owner/
  );
  assert.doesNotThrow(() =>
    requireApplicationOwner(
      { user: { accountType: 'APPLICATION_MANAGER', platformRole: 'OWNER' } },
      {},
      next
    )
  );
});

test('activation decisions accept only a UUID and an explicit approve or reject action', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(
    activationDecisionSchema.safeParse({ params: { id }, body: { decision: 'approve' } }).success,
    true
  );
  assert.equal(
    activationDecisionSchema.safeParse({ params: { id }, body: { decision: 'reject' } }).success,
    true
  );
  assert.equal(
    activationDecisionSchema.safeParse({ params: { id }, body: { decision: 'deny' } }).success,
    false
  );
  assert.equal(
    activationDecisionSchema.safeParse({ params: { id: 'not-an-id' }, body: {} }).success,
    false
  );
});

test('canonical activation mounts retain route and service owner enforcement', async () => {
  const [app, routes, service] = await Promise.all([
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/presentation/http/routes/activationRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/application/services/activationService.js', import.meta.url),
      'utf8'
    ),
  ]);

  assert.match(app, /app\.use\('\/api\/activation-requests', activationRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/activation-requests', activationRouter\)/);
  assert.match(routes, /router\.use\(authenticate, requireApplicationOwner\)/);
  assert.match(routes, /validate\(activationDecisionSchema\)/);
  assert.match(service, /owner\.accountType !== 'APPLICATION_MANAGER'/);
  assert.match(service, /owner\.platformRole !== 'OWNER'/);
  assert.match(service, /tx\.user\.updateMany/);
  assert.match(service, /status: 'PENDING_VERIFICATION'/);
  assert.match(service, /deletedAt: null/);
  assert.match(service, /if \(!activated\.count\)/);
});
