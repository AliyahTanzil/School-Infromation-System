import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  subjectCreateSchema,
  subjectStatusSchema,
} from '../../src/application/validators/subjectValidators.js';

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
  assert.equal(subjectStatusSchema.safeParse({ body: { status: 'INACTIVE' } }).success, true);
  assert.equal(subjectStatusSchema.safeParse({ body: { status: 'DELETED' } }).success, false);
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
