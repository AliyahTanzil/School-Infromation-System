import test from 'node:test';
import assert from 'node:assert/strict';
import {
  academicPolicyCreateSchema,
  academicPolicyIdSchema,
  academicPolicyQuerySchema,
  academicPolicyStatusSchema,
} from '../../src/application/validators/academicPolicyValidators.js';
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/academicPolicyService.js');
const id = '00000000-0000-4000-8000-000000000001';
const context = { tenantId: 'tenant', schoolId: 'school', userId: 'actor' };
const body = {
  name: 'Standard',
  code: 'STD',
  passMark: 50,
  effectiveFrom: new Date('2027-01-01'),
  bands: [{ label: 'All', minMark: 0, maxMark: 100, point: 1 }],
  weights: [{ name: 'Exam', code: 'EXAM', weight: 100, subjectId: id }],
};

test('academic policy requests reject invalid identifiers and nested ownership fields', () => {
  assert.equal(academicPolicyCreateSchema.safeParse({ body }).success, true);
  assert.equal(academicPolicyIdSchema.safeParse({ params: { id: 'invalid' } }).success, false);
  assert.equal(
    academicPolicyStatusSchema.safeParse({
      params: { id },
      body: { status: 'ACTIVE', tenantId: id },
    }).success,
    false
  );
  assert.equal(academicPolicyQuerySchema.safeParse({ query: { schoolId: id } }).success, false);
  for (const invalid of [
    { ...body, tenantId: id },
    { ...body, bands: [{ ...body.bands[0], schemeId: id }] },
    { ...body, weights: [{ ...body.weights[0], schemeId: id }] },
  ])
    assert.equal(academicPolicyCreateSchema.safeParse({ body: invalid }).success, false);
});

test('policy creation verifies unique subject ownership and persists in the same transaction', async () => {
  db.$transaction = async (work) =>
    work({
      subject: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, {
            id: { in: [id] },
            tenantId: 'tenant',
            schoolId: 'school',
            deletedAt: null,
          });
          return [{ id }];
        },
      },
      gradeScheme: {
        create: async ({ data }) => {
          assert.equal(data.tenantId, 'tenant');
          assert.equal(data.schoolId, 'school');
          return data;
        },
      },
    });
  await service.create(
    { ...body, weights: [body.weights[0], { ...body.weights[0], code: 'CA' }] },
    context
  );
});

test('foreign or deleted subject references stop policy creation before writing', async () => {
  db.$transaction = async (work) =>
    work({
      subject: { findMany: async () => [] },
      gradeScheme: { create: async () => assert.fail('must not write') },
    });
  await assert.rejects(service.create(body, context), /not found in this school/);
});

test('global policy weights do not require a subject lookup', async () => {
  db.$transaction = async (work) => work({ gradeScheme: { create: async ({ data }) => data } });
  const result = await service.create(
    { ...body, weights: [{ name: 'Exam', code: 'EXAM', weight: 100 }] },
    context
  );
  assert.equal(result.weights.create[0].weight, 100);
});

test('policy lifecycle update retains tenant, school and non-deleted ownership', async () => {
  db.gradeScheme = { findFirst: async () => ({ id, status: 'DRAFT' }) };
  db.$transaction = async (work) =>
    work({
      gradeSchemeHistory: {
        create: async ({ data }) => {
          assert.equal(data.actorId, 'actor');
        },
      },
      gradeScheme: {
        update: async ({ where }) => {
          assert.deepEqual(where, { id, tenantId: 'tenant', schoolId: 'school', deletedAt: null });
          return { id, status: 'ARCHIVED' };
        },
      },
    });
  await service.changeStatus(id, { status: 'ARCHIVED' }, context);
});
