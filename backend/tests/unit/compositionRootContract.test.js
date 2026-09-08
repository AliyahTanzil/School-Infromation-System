import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const repositoryRoot = new URL('../../../', import.meta.url);

async function doesNotExist(relativePath) {
  try {
    await stat(new URL(relativePath, repositoryRoot));
    return false;
  } catch (error) {
    if (error?.code === 'ENOENT') return true;
    throw error;
  }
}

test('only TypeScript source files own the backend composition root', async () => {
  assert.equal(await doesNotExist('backend/src/main.js'), true);
  assert.equal(await doesNotExist('backend/src/app.js'), true);
  assert.equal(await doesNotExist('backend/src/foundation/app.js'), true);
});

test('the container builds and starts the canonical compiled server', async () => {
  const dockerfile = await readFile(new URL('Dockerfile', repositoryRoot), 'utf8');
  assert.match(dockerfile, /npm ci --workspace=backend --ignore-scripts/);
  assert.match(dockerfile, /prisma generate --schema backend\/prisma\/schema\.prisma/);
  assert.match(dockerfile, /npm run build -w backend/);
  assert.match(dockerfile, /CMD \["node", "backend\/dist\/main\.js"\]/);
  assert.doesNotMatch(dockerfile, /backend\/src\/main\.js/);
  assert.match(dockerfile, /api\/v1\/health\/live/);
});
