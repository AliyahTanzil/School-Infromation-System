import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import {
  branchCreateSchema,
  branchUpdateSchema,
  schoolIdSchema,
  schoolListSchema,
  schoolSchema,
  updateSchoolSchema,
} from '../../src/application/validators/schoolValidators.js';
const db = { $on() {} };
globalThis.__prisma = db;
process.env.SINGLE_SCHOOL_ID = 'school';
const service = await import('../../src/application/services/schoolService.js');
const { default: controller } =
  await import('../../src/presentation/http/controllers/schoolController.js');
const school = { id: 'school', tenantId: 'tenant', name: 'Academy', code: 'academy' };
const fields = new Set(
  Prisma.dmmf.datamodel.models
    .find((model) => model.name === 'School')
    .fields.map((field) => field.name)
);
function validateFields(value) {
  for (const [key, nested] of Object.entries(value ?? {})) {
    if (['OR', 'AND'].includes(key)) nested.forEach(validateFields);
    else assert.ok(fields.has(key), `Unknown School field: ${key}`);
  }
}
function prepare() {
  const calls = [];
  db.$transaction = async (fn) => fn(db);
  const check = (args) => {
    validateFields(args.where);
    validateFields(args.data);
    validateFields(args.include);
    calls.push(args);
  };
  db.school = {
    findMany: async (args) => {
      check(args);
      return [school];
    },
    count: async (args) => {
      if (!args) return 0;
      check(args);
      return 1;
    },
    findFirst: async (args) => {
      check(args);
      return args.where.OR ? null : school;
    },
    create: async (args) => {
      check(args);
      return { id: 'school', ...args.data };
    },
    update: async (args) => {
      check(args);
      return { ...school, ...args.data };
    },
  };
  db.tenant = { findFirst: async () => ({ id: 'tenant' }) };
  return calls;
}
test('school listing and search use current Prisma fields and return the slug alias', async () => {
  prepare();
  const result = await service.list({ tenantId: 'tenant', search: 'academy' });
  assert.equal(result.items[0].slug, 'academy');
  assert.equal(result.total, 1);
});
test('create and partial update map the API slug to school code without obsolete nested records', async () => {
  const calls = prepare();
  const created = await service.create({
    name: 'Academy',
    slug: 'academy',
    email: 'a@example.com',
  });
  assert.equal(created.slug, 'academy');
  assert.equal(created.tenantId, 'tenant');
  await service.update('school', 'tenant', { name: 'Updated' });
  assert.deepEqual(calls.at(-1).data, { name: 'Updated' });
  assert.deepEqual(calls.at(-1).where, { id: 'school', tenantId: 'tenant' });
});
test('school list ignores client tenant overrides and rejects unscoped non-owner accounts', async () => {
  const calls = prepare();
  const res = {
    status() {
      return this;
    },
    json(value) {
      return value;
    },
  };
  await controller.list(
    {
      user: { tenantId: 'tenant' },
      query: { tenantId: 'other' },
      headers: { 'x-tenant-id': 'other' },
    },
    res
  );
  assert.equal(calls[0].where.tenantId, 'tenant');
  await controller.list(
    {
      user: { tenantId: 'tenant' },
      query: { tenantId: 'other' },
      headers: {},
    },
    res
  );
  assert.equal(calls.at(-2).where.tenantId, 'tenant');
  await assert.rejects(controller.list({ user: {}, query: {} }, res), /context is required/);
});

test('school and branch API inputs are strict, bounded, and UUID validated', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const branchId = '22222222-2222-4222-8222-222222222222';
  assert.equal(schoolListSchema.safeParse({ query: { tenantId: id } }).success, false);
  assert.equal(schoolListSchema.safeParse({ query: { pageSize: 101 } }).success, false);
  assert.equal(schoolIdSchema.safeParse({ params: { id: 'school' } }).success, false);
  assert.equal(
    schoolSchema.safeParse({ body: { name: 'Academy', slug: 'academy', tenantId: id } }).success,
    false
  );
  assert.equal(updateSchoolSchema.safeParse({ params: { id }, body: {} }).success, false);
  assert.equal(
    branchCreateSchema.safeParse({ params: { id }, body: { name: 'East', schoolId: id } }).success,
    false
  );
  assert.equal(
    branchUpdateSchema.safeParse({ params: { id, branchId }, body: { name: 'West', code: 'W' } })
      .success,
    false
  );
});

// Branches share the main school's identity boundary without creating another School.
test('second school creation is blocked before any records are written', async () => {
  prepare();
  db.school.count = async () => 1;
  db.school.create = async () => assert.fail('Must not create another school');
  await assert.rejects(service.create({ name: 'Second', slug: 'second' }), /Add a branch instead/);
});
test('the configured main school cannot be deleted', async () => {
  prepare();
  await assert.rejects(service.remove('school', 'tenant'), /cannot be deleted/);
});
test('branch creation generates a code and branch edits remain school scoped', async () => {
  prepare();
  let created;
  db.campus = {
    create: async ({ data }) => (created = { id: 'branch', ...data }),
    updateMany: async ({ where, data }) => {
      assert.deepEqual(where, { id: 'branch', schoolId: 'school' });
      assert.deepEqual(data, { name: 'West campus' });
      return { count: 1 };
    },
    findFirst: async () => created,
  };
  const branch = await service.createBranch('school', 'tenant', { name: 'East campus' });
  assert.equal(branch.schoolId, 'school');
  assert.match(branch.code, /^BRN-/);
  await service.updateBranch('school', 'tenant', 'branch', { name: 'West campus' });
  db.school.findFirst = async () => null;
  await assert.rejects(service.createBranch('other', 'tenant', { name: 'Forbidden' }), /not found/);
});
