import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  subjectCreateSchema,
  subjectIdSchema,
  subjectQuerySchema,
  subjectUpdateSchema,
  subjectStatusSchema,
} from '../../src/application/validators/subjectValidators.js';

const params = { id: '00000000-0000-4000-8000-000000000001' };

test('subject input normalizes codes and rejects unknown ownership fields', () => {
  const parsed = subjectCreateSchema.parse({
    body: {
      code: ' math ',
      name: 'Mathematics',
      classAssignments: [{ classId: '00000000-0000-4000-8000-000000000001' }],
    },
  });
  assert.equal(parsed.body.code, 'MATH');
  assert.equal(
    subjectCreateSchema.safeParse({ body: { code: 'X', name: 'X', tenantId: 'forged' } }).success,
    false
  );
});

test('subject lifecycle accepts only controlled statuses', () => {
  assert.equal(
    subjectStatusSchema.safeParse({ params, body: { status: 'INACTIVE' } }).success,
    true
  );
  assert.equal(
    subjectStatusSchema.safeParse({ params, body: { status: 'DELETED' } }).success,
    false
  );
});

test('subject requests reject invalid identifiers, empty updates and scope overrides', () => {
  assert.equal(subjectIdSchema.safeParse({ params }).success, true);
  for (const [schema, body] of [
    [subjectIdSchema, undefined],
    [subjectUpdateSchema, { name: 'Math' }],
    [subjectStatusSchema, { status: 'ACTIVE' }],
  ]) {
    assert.equal(schema.safeParse({ params: { id: 'invalid' }, body }).success, false);
  }
  assert.equal(subjectUpdateSchema.safeParse({ params, body: {} }).success, false);
  assert.equal(subjectUpdateSchema.safeParse({ params, body: { name: 'Math' } }).success, true);
  assert.equal(subjectQuerySchema.safeParse({ query: { schoolId: params.id } }).success, false);
  assert.equal(
    subjectQuerySchema.safeParse({ query: { query: 'Math', status: 'ACTIVE' } }).success,
    true
  );
  assert.equal(
    subjectCreateSchema.safeParse({
      body: {
        name: 'Math',
        classAssignments: [{ classId: params.id, tenantId: params.id }],
      },
    }).success,
    false
  );
});

test('subject persistence and routes enforce tenant and school scope', async () => {
  const [schema, repository, routes, app] = await Promise.all([
    readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/infrastructure/repositories/subjectRepository.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../src/presentation/http/routes/index.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(schema, /model Subject \{/);
  assert.match(schema, /@@unique\(\[tenantId, schoolId, code\]\)/);
  assert.match(repository, /tenantId: context\.tenantId/);
  assert.match(repository, /schoolId: context\.schoolId/);
  assert.match(routes, /router\.use\('\/subjects', subjectRoutes\)/);
  assert.match(app, /app\.use\('\/api\/subjects', subjectRouter\)/);
});
