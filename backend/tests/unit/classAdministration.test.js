import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classCreateSchema,
  classIdSchema,
  classQuerySchema,
  classStatusSchema,
  classSubjectSchema,
  enrollmentSchema,
} from '../../src/application/validators/classValidators.js';

const id = '00000000-0000-4000-8000-000000000001';
const params = { id };
const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/classController.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const response = {
  status() {
    return this;
  },
  json(value) {
    return value;
  },
};
const next = (error) => {
  throw error;
};

test('class administration validates route identifiers and rejects forged mutation fields', () => {
  for (const [schema, body] of [
    [classIdSchema, undefined],
    [classStatusSchema, { status: 'ACTIVE' }],
    [classSubjectSchema, { subjectId: id }],
    [enrollmentSchema, { studentId: id }],
  ]) {
    assert.equal(schema.safeParse({ params, body }).success, true);
    assert.equal(schema.safeParse({ params: { id: 'invalid' }, body }).success, false);
    if (body) {
      for (const field of ['tenantId', 'schoolId', 'actorId', 'classId']) {
        assert.equal(schema.safeParse({ params, body: { ...body, [field]: id } }).success, false);
      }
    }
  }
  const body = { name: 'Blue', capacity: 30, academicYear: 2026, gradeLevelCode: 'PRIMARY_SCHOOL' };
  assert.equal(classCreateSchema.safeParse({ body }).success, true);
  assert.equal(classCreateSchema.safeParse({ body: { ...body, schoolId: id } }).success, false);
  assert.equal(
    classSubjectSchema.safeParse({ params, body: { subject: { name: 'Math', tenantId: id } } })
      .success,
    false
  );
});

test('class list queries reject invalid lifecycle states and unbounded pagination', () => {
  for (const query of [
    { status: 'UNKNOWN' },
    { page: 10001 },
    { pageSize: 101 },
    { schoolId: id },
  ]) {
    assert.equal(classQuerySchema.safeParse({ query }).success, false);
  }
  assert.equal(
    classQuerySchema.safeParse({ query: { status: 'PLANNED', page: '1', pageSize: '100' } })
      .success,
    true
  );
});

test('class list controller keeps authenticated ownership even without validation middleware', async () => {
  db.class = {
    findMany: async ({ where }) => {
      assert.equal(where.tenantId, scope.tenantId);
      assert.equal(where.schoolId, scope.schoolId);
      return [];
    },
    count: async ({ where }) => {
      assert.equal(where.tenantId, scope.tenantId);
      assert.equal(where.schoolId, scope.schoolId);
      return 0;
    },
  };
  await controller.list(
    { schoolContext: scope, query: { tenantId: 'forged', schoolId: 'forged' } },
    response,
    next
  );
});

test('class status controller preserves route identity, actor and school ownership', async () => {
  db.class = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id, ...scope, deletedAt: null });
      return { id, status: 'PLANNED' };
    },
  };
  db.$transaction = async (work) =>
    work({
      class: {
        update: async ({ where }) => {
          assert.deepEqual(where, { id, ...scope });
          return { id };
        },
      },
      classHistory: {
        create: async ({ data }) => {
          assert.equal(data.classId, id);
          assert.equal(data.actorId, 'actor');
          return data;
        },
      },
    });
  await controller.changeStatus(
    {
      schoolContext: scope,
      params,
      user: { id: 'actor' },
      body: {
        status: 'ACTIVE',
        id: 'forged',
        actorId: 'forged',
        tenantId: 'forged',
        schoolId: 'forged',
      },
    },
    response,
    next
  );
});
