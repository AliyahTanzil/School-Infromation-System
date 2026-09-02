import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = new URL('../../prisma/seeders/developmentAccounts.seeder.js', import.meta.url);

test('development account seeding is production-safe and uses active schema keys', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /NODE_ENV === 'production'/);
  assert.match(source, /tenantId_code/);
  assert.match(source, /userId_roleId/);
  assert.match(source, /roleId_permissionId/);
  assert.match(source, /parentId_studentId/);
  assert.match(source, /timeout: 120_000/);
  assert.doesNotMatch(source, /permissionGroup|scopeKey|tenantId_slug/);
});

test('development student identity matches the authenticated user contract', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /id: studentUser\.id/);
  assert.match(source, /student\.id !== studentUser\.id/);
});
