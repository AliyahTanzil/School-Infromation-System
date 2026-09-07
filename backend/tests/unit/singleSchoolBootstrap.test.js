import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureConfiguredSingleSchool } from '../../src/application/services/singleSchoolBootstrapService.js';

const withConfig = async (run) => {
  const previous = {
    id: process.env.SINGLE_SCHOOL_ID,
    name: process.env.SINGLE_SCHOOL_NAME,
    code: process.env.SINGLE_SCHOOL_CODE,
  };
  process.env.SINGLE_SCHOOL_ID = '46408211-068f-4ded-8a94-db3bbea9cbea';
  process.env.SINGLE_SCHOOL_NAME = 'Aunty Isha International Academy';
  process.env.SINGLE_SCHOOL_CODE = 'AIIA';
  try {
    await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      const name = `SINGLE_SCHOOL_${key.toUpperCase()}`;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
};

test('creates the configured school once when the database is empty', async () =>
  withConfig(async () => {
    const writes = [];
    const db = {
      $transaction: (operation) => operation(db),
      school: {
        findUnique: async () => null,
        count: async () => 0,
        create: async ({ data }) => {
          writes.push(data);
          return data;
        },
      },
      tenant: {
        upsert: async ({ create }) => ({ id: 'tenant-id', ...create }),
      },
    };

    const result = await ensureConfiguredSingleSchool(db);
    assert.equal(result.created, true);
    assert.equal(result.school.id, process.env.SINGLE_SCHOOL_ID);
    assert.equal(result.school.tenantId, 'tenant-id');
    assert.equal(result.school.name, 'Aunty Isha International Academy');
    assert.equal(writes.length, 1);
  }));

test('reuses a matching configured school without writing', async () =>
  withConfig(async () => {
    const school = {
      id: process.env.SINGLE_SCHOOL_ID,
      name: process.env.SINGLE_SCHOOL_NAME,
    };
    const db = {
      $transaction: (operation) => operation(db),
      school: { findUnique: async () => school },
    };

    assert.deepEqual(await ensureConfiguredSingleSchool(db), { school, created: false });
  }));

test('refuses to create a second school when the configured ID is missing', async () =>
  withConfig(async () => {
    const db = {
      $transaction: (operation) => operation(db),
      school: { findUnique: async () => null, count: async () => 1 },
    };

    await assert.rejects(() => ensureConfiguredSingleSchool(db), /automatic bootstrap refused/);
  }));

test('rejects incomplete startup configuration', async () => {
  const previousId = process.env.SINGLE_SCHOOL_ID;
  const previousName = process.env.SINGLE_SCHOOL_NAME;
  process.env.SINGLE_SCHOOL_ID = '46408211-068f-4ded-8a94-db3bbea9cbea';
  delete process.env.SINGLE_SCHOOL_NAME;
  try {
    await assert.rejects(
      () => ensureConfiguredSingleSchool({}),
      /SINGLE_SCHOOL_ID and SINGLE_SCHOOL_NAME must be configured together/
    );
  } finally {
    if (previousId === undefined) delete process.env.SINGLE_SCHOOL_ID;
    else process.env.SINGLE_SCHOOL_ID = previousId;
    if (previousName === undefined) delete process.env.SINGLE_SCHOOL_NAME;
    else process.env.SINGLE_SCHOOL_NAME = previousName;
  }
});
