import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/foundation/prisma.js';

test('database connectivity query succeeds when DATABASE_URL is configured', async (t) => {
  if (process.env.SKIP_DATABASE_TESTS === '1') {
    t.skip('Live database checks are disabled for the deterministic test suite');
    return;
  }
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL is not configured in this environment');
    return;
  }
  const rows = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 AS result`;
  assert.equal(rows[0]?.result, 1);
});
