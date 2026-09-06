import assert from 'node:assert/strict';
import test from 'node:test';
import { globalSearch } from '../../src/application/services/searchService.js';

test('globalSearch returns structured empty result when query is empty', async () => {
  const result = await globalSearch({ tenantId: 'test-tenant-123' }, 'user-1', [], '');
  assert.equal(result.query, '');
  assert.equal(result.totalResults, 0);
  assert.equal(Array.isArray(result.classrooms), true);
  assert.equal(Array.isArray(result.assignments), true);
  assert.equal(Array.isArray(result.materials), true);
  assert.equal(Array.isArray(result.announcements), true);
  assert.equal(Array.isArray(result.subjects), true);
});

test('globalSearch executes structured query across categories', async () => {
  const result = await globalSearch(
    { tenantId: 'test-tenant-123' },
    'user-1',
    ['SCHOOL_ADMIN'],
    'math',
    {
      digitalClassroom: { findMany: async () => [] },
      subject: { findMany: async () => [] },
    }
  );
  assert.equal(result.query, 'math');
  assert.equal(typeof result.totalResults, 'number');
  assert.equal(Array.isArray(result.classrooms), true);
  assert.equal(Array.isArray(result.assignments), true);
  assert.equal(Array.isArray(result.materials), true);
  assert.equal(Array.isArray(result.announcements), true);
  assert.equal(Array.isArray(result.subjects), true);
});
