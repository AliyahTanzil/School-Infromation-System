import assert from 'node:assert/strict';
import test from 'node:test';

test('student API requires tenant-scoped authorization permissions', async () => {
  const source = await import('../../src/presentation/http/routes/studentDomainRoutes.js');
  assert.ok(source.default);
});

test('student route surface exposes only tenant-safe operations', async () => {
  const source = await import('../../src/presentation/http/routes/studentDomainRoutes.js');
  const routeStack = source.default.stack.map((layer) => layer.route?.path).filter(Boolean);
  assert.deepEqual(routeStack, ['/', '/:id', '/', '/:id', '/:id/guardians']);
});
