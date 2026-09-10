import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { examinationIdSchema } from '../../src/application/validators/examinationValidators.js';
import { assertMarkAuthorization } from '../../src/application/services/examinationService.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('examination routes require authenticated school context and validation', async () => {
  const routes = await read('../../src/presentation/http/routes/examinationRoutes.js');
  assert.match(routes, /authenticate, teacherContext/);
  assert.match(routes, /validate\(examinationCreateSchema\)/);
  assert.match(routes, /validate\(examinationMarkSchema\)/);
});
test('teachers can read examinations and enter marks but cannot administer their lifecycle', async () => {
  const routes = await read('../../src/presentation/http/routes/examinationRoutes.js');
  assert.match(routes, /const readOrMark = authorizeSchoolAdminOrTeacher/);
  assert.match(routes, /const administer = authorizeSchoolAdmin/);
  assert.match(routes, /router\.post\('\/', administer, validate\(examinationCreateSchema\)/);
  assert.match(routes, /'\/:id\/candidates',[\s\S]*?administer,/);
  assert.match(routes, /'\/:id\/schedules',[\s\S]*?administer,/);
  assert.match(routes, /'\/:id\/status',[\s\S]*?administer,/);
  assert.match(routes, /router\.put\('\/:id\/marks', readOrMark/);
});
test('examination detail identifiers are validated UUIDs', () => {
  assert.equal(
    examinationIdSchema.safeParse({
      params: { id: '00000000-0000-4000-8000-000000000001' },
    }).success,
    true
  );
  assert.equal(examinationIdSchema.safeParse({ params: { id: 'not-an-id' } }).success, false);
});
test('candidate identity lookup is tenant, school, and deletion scoped', async () => {
  const service = await read('../../src/application/services/examinationService.js');
  assert.match(
    service,
    /id: input\.studentId,[\s\S]*?tenantId: context\.tenantId,[\s\S]*?schoolId: context\.schoolId,[\s\S]*?deletedAt: null/
  );
});
test('administrators may enter marks without a teacher assignment', async () => {
  await assert.doesNotReject(
    assertMarkAuthorization(
      { tenantId: 'tenant', schoolId: 'school' },
      'admin',
      { roles: ['SCHOOL_ADMIN'] },
      { classId: 'class' },
      'MATH',
      {}
    )
  );
});
test('teachers need an active identity and matching class-subject assignment', async () => {
  const context = { tenantId: 'tenant', schoolId: 'school' };
  const assigned = {
    teacher: { findFirst: async () => ({ id: 'teacher' }) },
    teacherTeachingAssignment: { findFirst: async () => ({ id: 'assignment' }) },
  };
  await assert.doesNotReject(
    assertMarkAuthorization(
      context,
      'user',
      { roles: ['TEACHER'] },
      { classId: 'class' },
      'MATH',
      assigned
    )
  );

  const unassigned = {
    ...assigned,
    teacherTeachingAssignment: { findFirst: async () => null },
  };
  await assert.rejects(
    assertMarkAuthorization(
      context,
      'user',
      { roles: ['TEACHER'] },
      { classId: 'class' },
      'MATH',
      unassigned
    ),
    (error) => error?.statusCode === 403
  );
});
test('active server mounts versioned and compatibility examination APIs', async () => {
  const app = await read('../../src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/examinations', examinationRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/examinations', examinationRouter\)/);
});
test('examination persistence has a checked-in non-destructive migration', async () => {
  const migration = await read(
    '../../prisma/migrations/20260827210000_examination_workflow/migration.sql'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "Examination"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
