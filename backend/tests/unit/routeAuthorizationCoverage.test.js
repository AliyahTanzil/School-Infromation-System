import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

const APP_PATH = fileURLToPath(new URL('../../src/foundation/app.ts', import.meta.url));

// Routers that are intentionally reachable without authentication: process health probes,
// the OpenAPI documentation UI, and the controlled 501 feature-unavailable stubs.
const PUBLIC_ROUTERS = new Set([
  'healthRoutes.js',
  'documentationRoutes.js',
  'featureUnavailableRoutes.js',
]);

test('every router mounted by the active app enforces authentication', async () => {
  const app = await readFile(APP_PATH, 'utf8');
  const mounted = new Set(
    [...app.matchAll(/presentation\/http\/routes\/([A-Za-z0-9_]+\.js)/g)].map((match) => match[1])
  );

  assert.ok(mounted.size > 20, 'expected the active app to mount the domain routers');

  const unguarded = [];
  for (const file of mounted) {
    if (PUBLIC_ROUTERS.has(file)) continue;
    const source = await readFile(
      new URL(`../../src/presentation/http/routes/${file}`, import.meta.url),
      'utf8'
    );
    if (!/\bauthenticate\b/.test(source)) unguarded.push(file);
  }

  assert.deepEqual(unguarded, []);
});
