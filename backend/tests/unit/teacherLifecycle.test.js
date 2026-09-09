import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';
import { assertTransition, canTransition } from '../../src/domain/teacherLifecycle.js';
import { readFile } from 'node:fs/promises';
import {
  teacherCreateSchema,
  teacherIdSchema,
  teacherQuerySchema,
  teacherStatusSchema,
} from '../../src/application/validators/teacherValidators.js';

const teacherId = '11111111-1111-4111-8111-111111111111';

test('allows supported teacher transitions', () => {
  assert.equal(canTransition('APPLICANT', 'ACTIVE'), true);
  assert.equal(canTransition('ACTIVE', 'ON_LEAVE'), true);
  assert.equal(canTransition('ACTIVE', 'RETIRED'), true);
});
test('rejects terminal and invalid transitions', () => {
  assert.equal(canTransition('TERMINATED', 'ACTIVE'), false);
  assert.throws(() => assertTransition('APPLICANT', 'RETIRED'), /Invalid teacher status/);
});

test('teacher administration accepts only strict persisted fields', () => {
  const valid = teacherCreateSchema.safeParse({
    body: {
      employeeNumber: ' T-001 ',
      profile: { firstName: ' Ada ', lastName: ' Lovelace ', email: 'ada@school.test' },
      employment: {
        jobTitle: 'Teacher',
        employmentType: 'FULL_TIME',
        startDate: '2026-09-01',
      },
    },
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.body.employeeNumber, 'T-001');

  assert.equal(
    teacherCreateSchema.safeParse({
      body: {
        employeeNumber: 'T-002',
        tenantId: teacherId,
        profile: { firstName: 'Grace', lastName: 'Hopper' },
      },
    }).success,
    false
  );
});

test('teacher list, detail, and status inputs are bounded and validated', () => {
  const query = teacherQuerySchema.parse({ query: {} });
  assert.deepEqual(query.query, { page: 1, pageSize: 50 });
  assert.equal(
    teacherQuerySchema.safeParse({ query: { status: 'UNKNOWN', pageSize: 101 } }).success,
    false
  );
  assert.equal(teacherIdSchema.safeParse({ params: { id: 'not-an-id' } }).success, false);
  assert.equal(
    teacherStatusSchema.safeParse({
      params: { id: teacherId },
      body: { status: 'ACTIVE', schoolId: teacherId },
    }).success,
    false
  );
  assert.equal(
    teacherStatusSchema.safeParse({
      params: { id: teacherId },
      body: { status: 'ACTIVE', reason: 'Approved' },
    }).success,
    true
  );
});

test('teacher persistence and routes use active tenant-scoped contracts', async () => {
  const [schema, repository, context, routes, app, teacherRoutes, controller] = await Promise.all([
    readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/infrastructure/repositories/teacherRepository.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../src/middleware/auth/teacherContext.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/presentation/http/routes/index.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/presentation/http/routes/teacherRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/presentation/http/controllers/teacherController.js', import.meta.url),
      'utf8'
    ),
  ]);
  assert.match(schema, /model Teacher \{/);
  assert.match(schema, /@@unique\(\[tenantId, employeeNumber\]\)/);
  assert.match(repository, /tenantId: context\.tenantId/);
  assert.match(repository, /schoolId: context\.schoolId/);
  assert.match(repository, /take: pageSize/);
  assert.match(repository, /findTeacherByUser\(userId, context\)/);
  assert.doesNotMatch(context, /schoolAdministrator/);
  assert.ok(teacherRoutes.indexOf('router.use(teacherContext)') < teacherRoutes.indexOf("'/me'"));
  assert.match(teacherRoutes, /validate\(teacherIdSchema\)/);
  assert.match(teacherRoutes, /'APPLICATION_MANAGER'/);
  assert.match(controller, /getMe\(req\.user\.id, req\.schoolContext\)/);
  assert.match(routes, /router\.use\('\/teachers', teacherRoutes\)/);
  assert.match(app, /app\.use\('\/api\/teachers', teacherRouter\)/);
});
