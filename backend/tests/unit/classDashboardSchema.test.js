import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import prisma from '../../src/infrastructure/orm/prismaClient.js';
import { getClassDashboard } from '../../src/infrastructure/repositories/classRepository.js';

test('class dashboard selects real Student fields and preserves scoped active enrollments', async () => {
  const original = prisma.class.findFirst;
  let query;
  prisma.class.findFirst = async (args) => {
    query = args;
    return { id: 'class-1' };
  };
  try {
    await getClassDashboard('class-1', { tenantId: 'tenant-1', schoolId: 'school-1' });
    assert.deepEqual(query.where, {
      id: 'class-1',
      tenantId: 'tenant-1',
      schoolId: 'school-1',
      deletedAt: null,
    });
    const enrollment = query.include.enrollments;
    assert.deepEqual(enrollment.where, { status: 'ACTIVE' });
    const fields = new Set(
      Prisma.dmmf.datamodel.models
        .find((model) => model.name === 'Student')
        .fields.map((field) => field.name)
    );
    for (const name of Object.keys(enrollment.include.student.select))
      assert.ok(fields.has(name), `Unknown Student field: ${name}`);
    assert.equal(enrollment.include.student.select.firstName, true);
    assert.equal(enrollment.include.student.select.lastName, true);
  } finally {
    prisma.class.findFirst = original;
  }
});
