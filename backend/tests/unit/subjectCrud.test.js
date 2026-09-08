import assert from 'node:assert/strict';
import test from 'node:test';
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/subjectService.js');
const { subjectUpdateSchema } =
  await import('../../src/application/validators/subjectValidators.js');
const context = { tenantId: 'tenant', schoolId: 'school' };
const classId = '00000000-0000-4000-8000-000000000001';

test('subject PATCH validates reassignment and rejects forged ownership', () => {
  assert.ok(
    subjectUpdateSchema.parse({
      body: { classAssignments: [{ classId, teachingFocus: 'Algebra' }] },
    })
  );
  assert.equal(subjectUpdateSchema.safeParse({ body: { classAssignments: [] } }).success, false);
  assert.equal(subjectUpdateSchema.safeParse({ body: { tenantId: 'forged' } }).success, false);
});

test('subject edits persist fields and replace class links in one scoped transaction', async () => {
  let saved;
  db.$transaction = async (work) =>
    work({
      subject: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'subject', ...context, deletedAt: null });
          return { id: 'subject' };
        },
        update: async ({ where, data }) => {
          assert.deepEqual(where, { id: 'subject', ...context, deletedAt: null });
          saved = data;
          return data;
        },
      },
      class: {
        findMany: async ({ where }) => {
          assert.equal(where.schoolId, 'school');
          return [{ id: classId }];
        },
      },
    });
  await service.update(
    'subject',
    { name: 'Maths', classAssignments: [{ classId, teachingFocus: 'Algebra' }] },
    context
  );
  assert.equal(saved.name, 'Maths');
  assert.deepEqual(saved.classes.create, [{ classId, teachingFocus: 'Algebra' }]);
  assert.deepEqual(saved.classes.deleteMany, {});
});

test('foreign class assignments are rejected before editing the record', async () => {
  db.$transaction = async (work) =>
    work({
      subject: {
        findFirst: async () => ({ id: 'subject' }),
        update: async () => assert.fail('must not write'),
      },
      class: { findMany: async () => [] },
    });
  await assert.rejects(
    service.update('subject', { classAssignments: [{ classId }] }, context),
    /not found/
  );
});

test('deletion hides the subject without destroying historical references', async () => {
  let deleted = false;
  db.subject = {
    findFirst: async ({ where }) => {
      assert.equal(where.deletedAt, null);
      return deleted ? null : { id: 'subject' };
    },
    update: async ({ where, data }) => {
      assert.equal(where.schoolId, 'school');
      assert.equal(data.status, 'ARCHIVED');
      assert.ok(data.deletedAt instanceof Date);
      deleted = true;
      return data;
    },
  };
  await service.remove('subject', context);
  await assert.rejects(service.get('subject', context), /Subject not found/);
});
