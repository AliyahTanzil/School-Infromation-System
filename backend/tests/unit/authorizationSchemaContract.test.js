import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('effective authorization follows the active Role permissions relation', async () => {
  const schema = await read('prisma/schema.prisma');
  const service = await read('src/application/services/authorizationService.js');
  assert.match(schema, /model Role[\s\S]*permissions\s+RolePermission\[\]/);
  assert.match(schema, /model Permission[\s\S]*key\s+String/);
  assert.match(service, /include: \{ permissions: \{ include: \{ permission: true \} \} \}/);
  assert.match(service, /grant\.permission\.key/);
  assert.doesNotMatch(service, /rolePermissions|permission\.effect|permission\.deletedAt/);
});

test('permission middleware grants the authenticated platform owner without seeded role grants', async () => {
  const middleware = await read('src/middleware/auth/permissionMiddleware.js');
  const authorization = await read('src/middleware/auth/authorization.js');
  assert.match(middleware, /req\.user\.platformRole === 'OWNER'/);
  assert.match(middleware, /source: 'platform-owner'/);
  assert.match(authorization, /req\.user\?\.platformRole === 'OWNER'/);
});
