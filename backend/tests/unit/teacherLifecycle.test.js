import assert from 'node:assert/strict';
import test from 'node:test';
import { assertTransition, canTransition } from '../../src/domain/teacherLifecycle.js';
import { readFile } from 'node:fs/promises';

test('allows supported teacher transitions', () => {
  assert.equal(canTransition('APPLICANT', 'ACTIVE'), true);
  assert.equal(canTransition('ACTIVE', 'ON_LEAVE'), true);
  assert.equal(canTransition('ACTIVE', 'RETIRED'), true);
});
test('rejects terminal and invalid transitions', () => {
  assert.equal(canTransition('TERMINATED', 'ACTIVE'), false);
  assert.throws(() => assertTransition('APPLICANT', 'RETIRED'), /Invalid teacher status/);
});

test('teacher persistence and routes use active tenant-scoped contracts', async () => {
  const [schema, repository, context, routes, app] = await Promise.all([
    readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/infrastructure/repositories/teacherRepository.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../src/middleware/auth/teacherContext.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/presentation/http/routes/index.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(schema, /model Teacher \{/);
  assert.match(schema, /@@unique\(\[tenantId, employeeNumber\]\)/);
  assert.match(repository, /tenantId: context\.tenantId/);
  assert.match(repository, /schoolId: context\.schoolId/);
  assert.doesNotMatch(context, /schoolAdministrator/);
  assert.match(routes, /router\.use\('\/teachers', teacherRoutes\)/);
  assert.match(app, /app\.use\('\/api\/teachers', teacherRouter\)/);
});
