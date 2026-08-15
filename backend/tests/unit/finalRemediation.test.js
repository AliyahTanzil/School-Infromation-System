import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../../', import.meta.url);

test('production scripts keep destructive development commands explicitly scoped', async () => {
  const packageJson = JSON.parse(await readFile(new URL('backend/package.json', root), 'utf8'));

  assert.match(packageJson.scripts['db:migrate'], /NODE_ENV=development/);
  assert.match(packageJson.scripts['db:reset'], /NODE_ENV=development/);
  assert.match(packageJson.scripts['db:seed'], /NODE_ENV=development/);
  assert.match(packageJson.scripts['db:migrate:deploy'], /prisma migrate deploy/);
});

test('frontend keeps a single React runtime boundary', async () => {
  const viteConfig = await readFile(new URL('frontend/vite.config.js', root), 'utf8');
  assert.match(viteConfig, /dedupe: \['react', 'react-dom', 'react-router', 'react-router-dom'\]/);
  assert.match(viteConfig, /alias:/);
});
