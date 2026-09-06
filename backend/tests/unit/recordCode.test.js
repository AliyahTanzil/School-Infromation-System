import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRecordCode } from '../../src/shared/utils/recordCode.js';
const db = { $on() {} };
globalThis.__prisma = db;
const students = await import('../../src/application/services/studentDomainService.js');
const subjects = await import('../../src/application/services/subjectService.js');
const schools = await import('../../src/application/services/schoolService.js');
const classrooms = await import('../../src/application/services/digitalClassroomService.js');
test('identical details get distinct bounded codes with a school-specific fingerprint', () => {
  const codes = Array.from({ length: 1000 }, () =>
    generateRecordCode('STU', 'school-a', ['Ada', '2010-01-01'])
  );
  assert.equal(new Set(codes).size, 1000);
  assert.ok(codes.every((code) => code.length <= 30));
  assert.equal(codes[0].split('-')[2], codes[1].split('-')[2]);
  assert.notEqual(
    codes[0].split('-')[2],
    generateRecordCode('STU', 'school-b', ['Ada', '2010-01-01']).split('-')[2]
  );
  assert.ok(!codes[0].includes('2010-01-01'));
});
test('student creation generates admission numbers and updates preserve identity', async () => {
  let saved;
  db.student = {
    create: async ({ data }) => (saved = data),
    findFirst: async () => saved,
    update: async ({ data }) => (saved = { ...saved, ...data }),
  };
  const created = await students.create({
    tenantId: 'tenant',
    input: { firstName: 'Ada', lastName: 'Cole', dateOfBirth: '2010-01-01' },
  });
  assert.match(created.admissionNumber, /^STU-ADA-/);
  const updated = await students.update({
    tenantId: 'tenant',
    id: created.id,
    input: { firstName: 'Adanna' },
  });
  assert.equal(updated.id, created.id);
  assert.equal(updated.admissionNumber, created.admissionNumber);
});
test('school, subject and digital classroom create scoped codes when omitted', async () => {
  db.$transaction = async (fn) => fn(db);
  db.school = { findFirst: async () => null, create: async ({ data }) => data };
  const school = await schools.create({ tenantId: 'tenant', name: 'Oak Academy' });
  assert.match(school.code, /^sch-oakaca-/);
  assert.equal(school.slug, school.code);
  db.subject = { create: async ({ data }) => data };
  const subject = await subjects.create(
    { name: 'Mathematics' },
    { tenantId: 'tenant', schoolId: 'school' }
  );
  assert.match(subject.code, /^SUB-MATHEM-/);
  db.digitalClassroom = { create: async ({ data }) => data };
  const classroom = await classrooms.create({ tenantId: 'tenant', schoolId: 'school' }, 'teacher', {
    name: 'Biology',
  });
  assert.match(classroom.code, /^DCL-BIOLOG-/);
});
const { default: schoolContext } = await import('../../src/middleware/auth/singleSchoolContext.js');
test('school selection validates identity and never allows a tenant user to cross schools', async () => {
  const id = '12345678-1234-1234-1234-123456789012';
  db.school = {
    findFirst: async ({ where }) => {
      assert.equal(where.tenantId, 'tenant');
      return null;
    },
  };
  await assert.rejects(
    schoolContext({ user: { tenantId: 'tenant' }, get: () => id }, {}, () => assert.fail()),
    /not available/
  );
  db.school.findFirst = async ({ where }) => {
    assert.deepEqual(where, { id });
    return { id, tenantId: 'other' };
  };
  const req = { user: { id: 'owner', platformRole: 'OWNER' }, get: () => id };
  let continued = false;
  await schoolContext(req, {}, () => {
    continued = true;
  });
  assert.equal(continued, true);
  assert.equal(req.schoolContext.tenantId, 'other');
});
