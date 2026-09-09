import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/parentService.js');
const repository = await import('../../src/infrastructure/repositories/parentRepository.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const ownership = {
  tenantId: 'tenant',
  deletedAt: null,
  OR: [{ schoolId: 'school' }, { schoolId: null }],
};

test('parent operations reject missing scope before persistence', async () => {
  await assert.rejects(service.updateProfile('parent', {}, {}), /context is required/);
  await assert.rejects(service.unlink('parent', 'student', {}), /context is required/);
  await assert.rejects(service.link('parent', {}, 'student', 'Mother'), /context is required/);
  await assert.rejects(service.getPortal('parent', {}, {}), /context is required/);
});

test('parent profile and unlink writes constrain the owning active parent', async () => {
  db.parentProfile = {
    update: async ({ where, data }) => {
      assert.deepEqual(where, { parentId: 'parent', parent: ownership });
      return data;
    },
  };
  db.parentStudentRelationship = {
    update: async ({ where, data }) => {
      assert.deepEqual(where, {
        parentId_studentId: { parentId: 'parent', studentId: 'student' },
        parent: ownership,
      });
      assert.equal(data.status, 'REVOKED');
      assert.ok(data.revokedAt instanceof Date);
    },
  };
  await service.updateProfile('parent', { firstName: 'Jane', lastName: 'Doe' }, scope);
  await service.unlink('parent', 'student', scope);
});

test('parent linking checks both identities and writes through the same transaction', async () => {
  db.$transaction = async (work) =>
    work({
      parent: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'parent', ...ownership });
          return { id: 'parent' };
        },
      },
      student: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, {
            id: 'student',
            tenantId: scope.tenantId,
            classEnrollments: { some: { ...scope, status: 'ACTIVE' } },
          });
          return { id: 'student' };
        },
      },
      parentStudentRelationship: {
        upsert: async ({ create, update }) => {
          assert.deepEqual(create, {
            parentId: 'parent',
            studentId: 'student',
            relationship: 'Mother',
          });
          assert.equal(update.status, 'PENDING');
          return create;
        },
      },
    });
  await service.link('parent', scope, 'student', 'Mother');
});

test('parent linking rejects absent parent or eligible student before writing', async () => {
  for (const parentExists of [false, true]) {
    db.$transaction = async (work) =>
      work({
        parent: { findFirst: async () => (parentExists ? { id: 'parent' } : null) },
        student: {
          findFirst: async () => {
            assert.equal(parentExists, true);
            return null;
          },
        },
        parentStudentRelationship: { upsert: async () => assert.fail('must not write') },
      });
    await assert.rejects(service.link('parent', scope, 'student', 'Mother'), /not found/);
  }
});

test('portal relationships require student tenant ownership and active school enrollment', async () => {
  db.parent = {
    findFirst: async ({ include }) => {
      assert.deepEqual(include.relationships.where.student, {
        tenantId: scope.tenantId,
        classEnrollments: { some: { ...scope, status: 'ACTIVE' } },
      });
      assert.equal(include.relationships.where.status, 'ACTIVE');
      assert.equal(include.relationships.where.revokedAt, null);
      return null;
    },
  };
  await repository.findPortal('parent', scope);
});
