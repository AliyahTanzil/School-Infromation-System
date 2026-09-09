import test from 'node:test';
import assert from 'node:assert/strict';
import {
  academicPeriodQuerySchema,
  academicPeriodCreateSchema,
  academicPeriodStatusSchema,
  academicEventCreateSchema,
} from '../../src/application/validators/academicPeriodValidators.js';

const db = { $on() {} };
globalThis.__prisma = db;
const { default: controller } =
  await import('../../src/presentation/http/controllers/academicPeriodController.js');
const { changeAcademicPeriodStatus } =
  await import('../../src/application/services/academicPeriodService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const id = '00000000-0000-4000-8000-000000000001';
const params = { id };

test('academic request schemas reject ownership overrides and retain valid date contracts', () => {
  const period = { name: '2027', type: 'YEAR', startsAt: '2027-01-01', endsAt: '2027-12-31' };
  const event = { ...period, type: 'EVENT', code: 'DAY' };
  for (const [schema, input] of [
    [academicPeriodCreateSchema, { body: period }],
    [academicEventCreateSchema, { body: event }],
    [academicPeriodStatusSchema, { params, body: { status: 'ACTIVE' } }],
  ]) {
    assert.equal(schema.safeParse(input).success, true);
    for (const field of ['tenantId', 'schoolId', 'actorId', 'id']) {
      assert.equal(
        schema.safeParse({ ...input, body: { ...input.body, [field]: id } }).success,
        false
      );
    }
  }
  assert.equal(academicPeriodQuerySchema.safeParse({ query: { tenantId: id } }).success, false);
  assert.equal(
    academicPeriodStatusSchema.safeParse({ params: { id: 'bad' }, body: { status: 'ACTIVE' } })
      .success,
    false
  );
  assert.equal(
    academicPeriodCreateSchema.safeParse({ body: { ...period, endsAt: '2026-01-01' } }).success,
    false
  );
});

test('academic list controller preserves authenticated scope without validation middleware', async () => {
  db.academicYear = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { tenantId: scope.tenantId });
      return [];
    },
  };
  db.academicTerm = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { academicYear: { tenantId: scope.tenantId } });
      return [];
    },
  };
  db.academicCalendarEvent = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, scope);
      return [];
    },
  };
  await controller.list(
    { schoolContext: scope, query: { tenantId: 'forged', schoolId: 'forged' } },
    { json: (value) => value }
  );
});

test('academic status controller and year writes retain tenant and route ownership', async () => {
  db.academicYear = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id, tenantId: scope.tenantId });
      return { id, isCurrent: false };
    },
  };
  db.$transaction = async (work) =>
    work({
      academicYear: {
        updateMany: async ({ where }) => {
          assert.deepEqual(where, { tenantId: scope.tenantId, isCurrent: true });
        },
        update: async ({ where }) => {
          assert.deepEqual(where, { id, tenantId: scope.tenantId });
          return { id, isCurrent: true };
        },
      },
    });
  await controller.changeStatus(
    {
      schoolContext: scope,
      params,
      user: { id: 'actor' },
      body: { status: 'ACTIVE', id: 'forged', tenantId: 'forged', schoolId: 'forged' },
    },
    { json: (value) => value }
  );
});

test('term and event status writes include their owning tenant and school', async () => {
  db.academicYear = { findFirst: async () => null };
  db.academicTerm = {
    findFirst: async () => ({ id, status: 'PLANNED' }),
    update: async ({ where }) => {
      assert.deepEqual(where, { id, academicYear: { tenantId: scope.tenantId } });
      return { id, status: 'ACTIVE' };
    },
  };
  await changeAcademicPeriodStatus({ ...scope, id, status: 'ACTIVE' });
  db.academicTerm.findFirst = async () => null;
  db.academicCalendarEvent = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id, ...scope });
      return { id, status: 'PLANNED' };
    },
    update: async ({ where }) => {
      assert.deepEqual(where, { id, ...scope });
      return { id, type: 'EVENT', status: 'ACTIVE' };
    },
  };
  await changeAcademicPeriodStatus({ ...scope, id, status: 'ACTIVE' });
});
