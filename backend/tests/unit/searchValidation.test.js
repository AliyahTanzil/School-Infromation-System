import test from 'node:test';
import assert from 'node:assert/strict';
import validate from '../../src/middleware/validation/validate.js';
import { searchQuerySchema } from '../../src/application/validators/searchValidators.js';

const db = { $on() {} };
globalThis.__prisma = db;
const { globalSearch } = await import('../../src/application/services/searchService.js');
const { search } = await import('../../src/presentation/http/controllers/searchController.js');
const { default: router } = await import('../../src/presentation/http/routes/searchRoutes.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };

test('search schema accepts empty input, supported aliases and the exact length limit', () => {
  assert.equal(searchQuerySchema.safeParse({ query: {} }).success, true);
  for (const alias of ['q', 'query', 'search']) {
    assert.equal(
      searchQuerySchema.safeParse({ query: { [alias]: 'x'.repeat(200) } }).success,
      true
    );
    assert.equal(searchQuerySchema.parse({ query: { [alias]: ' math ' } }).query[alias], 'math');
    for (const value of ['x'.repeat(201), ['math'], { term: 'math' }, 42, null]) {
      assert.equal(searchQuerySchema.safeParse({ query: { [alias]: value } }).success, false);
    }
  }
  assert.equal(
    searchQuerySchema.safeParse({ query: { q: 'math', schoolId: 'foreign' } }).success,
    false
  );
});

test('route validation rejects malformed terms before the search controller', () => {
  const route = router.stack.find((layer) => layer.route).route;
  assert.equal(route.stack.length, 2);
  assert.equal(route.stack[1].handle, search);
  for (const query of [
    { q: ['a', 'b'] },
    { q: 'x'.repeat(201) },
    { q: 'math', platformRole: 'OWNER' },
  ]) {
    assert.throws(
      () =>
        route.stack[0].handle({ query }, {}, () => assert.fail('Invalid query passed validation')),
      (error) => error.statusCode === 400 && error.code === 'VALIDATION_ERROR'
    );
  }
});

test('direct service calls reject nonstrings and oversized terms before database access', async () => {
  let reads = 0;
  const database = {
    digitalClassroom: {
      findMany: async () => {
        reads++;
        return [];
      },
    },
  };
  for (const value of [null, false, 1, ['math'], { term: 'math' }, 'x'.repeat(201)]) {
    await assert.rejects(globalSearch(scope, 'actor', {}, value, database), /at most 200/);
  }
  assert.equal(reads, 0);
});

test('validated aliases work through getter-only query objects and preserve precedence', async () => {
  db.digitalClassroom = { findMany: async () => [] };
  db.subject = { findMany: async () => [] };
  for (const [query, expected] of [
    [{ q: ' math ' }, 'math'],
    [{ query: 'science' }, 'science'],
    [{ search: 'history' }, 'history'],
    [{ q: 'math', query: 'science', search: 'history' }, 'math'],
    [{ q: ' ', query: 'science' }, 'science'],
    [{}, ''],
  ]) {
    const req = { user: { id: 'actor', roles: [] }, schoolContext: scope };
    Object.defineProperty(req, 'query', { get: () => query });
    validate(searchQuerySchema)(req, {}, () => {});
    assert.ok(req.validatedQuery);
    let result;
    await search(req, {
      json(value) {
        result = value.data;
      },
    });
    assert.equal(result.query, expected);
  }
});
