import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { seedDevelopmentAccounts } from '../../prisma/seeders/developmentAccounts.seeder.js';

const sourceUrl = new URL('../../prisma/seeders/developmentAccounts.seeder.js', import.meta.url);

test('development bootstrap resolves the existing school before any writes', async (t) => {
  const previous = process.env.SINGLE_SCHOOL_ID;
  t.after(() => {
    if (previous === undefined) delete process.env.SINGLE_SCHOOL_ID;
    else process.env.SINGLE_SCHOOL_ID = previous;
  });
  for (const configured of [true, false]) {
    if (configured) process.env.SINGLE_SCHOOL_ID = ' main-school ';
    else delete process.env.SINGLE_SCHOOL_ID;
    const stop = new Error('reached permission provisioning');
    const tx = {
      school: {
        findMany: async (query) => {
          assert.deepEqual(query.where, configured ? { id: 'main-school' } : {});
          assert.equal(query.take, configured ? 1 : 2);
          return [{ id: 'main-school', tenantId: 'main-tenant' }];
        },
      },
      tenant: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'main-tenant', status: 'ACTIVE', deletedAt: null });
          return { id: 'main-tenant' };
        },
      },
      permission: {
        upsert: async () => {
          throw stop;
        },
      },
    };
    await assert.rejects(
      seedDevelopmentAccounts({ $transaction: (run) => run(tx) }),
      (error) => error === stop
    );
  }
});

test('development bootstrap refuses missing, ambiguous, or inactive school context without writes', async () => {
  for (const schools of [
    [],
    [{ id: 'one' }, { id: 'two' }],
    [{ id: 'one', tenantId: null }],
    [{ id: 'one', tenantId: 'inactive' }],
  ]) {
    const tx = {
      school: { findMany: async () => schools },
      tenant: { findFirst: async () => null },
    };
    await assert.rejects(
      seedDevelopmentAccounts({ $transaction: (run) => run(tx) }),
      /Bootstrap the main school|must have an active tenant/
    );
  }
});

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
