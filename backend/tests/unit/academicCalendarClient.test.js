import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

test('generated Prisma client exposes all models needed to load the academic calendar', async () => {
  // Use the actual generated client: service doubles cannot detect stale generation.
  // Inspect delegates only; this test never connects to or queries a database.
  const client = new PrismaClient();
  try {
    for (const model of ['academicYear', 'academicTerm', 'academicCalendarEvent']) {
      assert.equal(
        typeof client[model]?.findMany,
        'function',
        `${model} is missing: run npm run db:generate -w backend and restart the backend`
      );
    }
  } finally {
    await client.$disconnect();
  }
});
