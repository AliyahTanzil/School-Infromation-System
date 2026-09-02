import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('single-school middleware resolves tenant-bound users before global configuration', async () => {
  const service = await readFile(
    new URL('../../src/application/services/singleSchoolContextService.js', import.meta.url),
    'utf8'
  );
  const middleware = await readFile(
    new URL('../../src/middleware/auth/singleSchoolContext.js', import.meta.url),
    'utf8'
  );

  assert.match(service, /tenantId \? \{ tenantId \}/);
  assert.match(service, /!tenantId && !configuredId/);
  assert.match(middleware, /tenantId: req\.user\.tenantId \|\| undefined/);
});

test('active foundation server mounts both student API paths', async () => {
  const source = await readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8');

  assert.match(source, /app\.use\('\/api\/students', studentRouter\)/);
  assert.match(source, /app\.use\('\/api\/v1\/students', studentRouter\)/);
});
