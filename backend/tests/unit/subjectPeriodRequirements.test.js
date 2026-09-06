import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateTimetableSlots,
  validateSubjectPeriodCapacity,
} from '../../src/domain/timetableEngine.js';
import {
  subjectPeriodSchema,
  subjectPeriodUpdateSchema,
} from '../../src/application/validators/timetableValidators.js';

const settings = {
  workingDays: [1, 2],
  schoolStartsAt: '08:00',
  schoolEndsAt: '12:30',
  lessonDurationMinutes: 60,
  breakStartsAt: '09:30',
  breakEndsAt: '10:00',
  maxPeriodsPerDay: 8,
  maxTeacherPeriodsDay: 6,
  maxTeacherPeriodsWeek: 30,
  maxConsecutivePeriods: 3,
  allowDoublePeriods: false,
  allowSaturday: false,
};
const requirement = {
  classId: 'class-a',
  subjectId: 'subject-a',
  academicYearId: 'year',
  termId: 'term',
  periodsPerWeek: 4,
};

test('capacity excludes breaks, partial lessons and respects daily limits', () => {
  const slots = generateTimetableSlots(settings);
  assert.equal(slots.filter((slot) => !slot.isBreak).length, 6);
  assert.deepEqual(
    slots.filter((slot) => slot.weekday === 1).map((slot) => [slot.startTime, slot.endTime]),
    [
      ['08:00', '09:00'],
      ['09:30', '10:00'],
      ['10:00', '11:00'],
      ['11:00', '12:00'],
    ]
  );
  assert.equal(
    generateTimetableSlots({ ...settings, maxPeriodsPerDay: 1 }).filter((slot) => !slot.isBreak)
      .length,
    2
  );
});

test('class totals accept exact capacity and reject overflow, independently by class and term', () => {
  assert.deepEqual(
    validateSubjectPeriodCapacity(settings, [requirement, { ...requirement, periodsPerWeek: 2 }]),
    { periodsPerWeek: 6 }
  );
  assert.throws(
    () =>
      validateSubjectPeriodCapacity(settings, [requirement, { ...requirement, periodsPerWeek: 3 }]),
    /capacity is 6/
  );
  assert.doesNotThrow(() =>
    validateSubjectPeriodCapacity(settings, [
      requirement,
      { ...requirement, classId: 'class-b' },
      { ...requirement, termId: 'other' },
    ])
  );
});

test('period bounds and double-period feasibility are enforced', () => {
  for (const input of [
    { periodsPerWeek: 0 },
    { minimumPeriods: 5 },
    { maximumPeriods: 3 },
    { minimumPeriods: -1 },
  ]) {
    assert.throws(
      () => validateSubjectPeriodCapacity(settings, [{ ...requirement, ...input }]),
      /bounds/
    );
  }
  const double = { ...requirement, requiresDoublePeriod: true };
  assert.throws(() => validateSubjectPeriodCapacity(settings, [double]), /Double periods/);
  assert.doesNotThrow(() =>
    validateSubjectPeriodCapacity({ ...settings, allowDoublePeriods: true }, [double])
  );
  assert.throws(
    () =>
      validateSubjectPeriodCapacity(
        { ...settings, allowDoublePeriods: true, maxPeriodsPerDay: 1 },
        [double]
      ),
    /adjacent/
  );
});

test('request validation supports partial updates without resetting omitted defaults', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.deepEqual(
    subjectPeriodUpdateSchema.parse({ params: { id }, body: { periodsPerWeek: 3 } }).body,
    { periodsPerWeek: 3 }
  );
  assert.equal(subjectPeriodUpdateSchema.safeParse({ params: { id }, body: {} }).success, false);
  assert.equal(subjectPeriodSchema.safeParse({ body: { ...requirement } }).success, false);
  assert.equal(
    subjectPeriodSchema.safeParse({
      body: { classId: id, subjectId: id, academicYearId: id, termId: id, periodsPerWeek: 1.5 },
    }).success,
    false
  );
});

// Inject an isolated database double before importing the service; no database connection is used.
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/timetableService.js');
const scope = { tenantId: 'tenant-a', schoolId: 'school-a' };
function prepare() {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  for (const entity of ['subject', 'class', 'academicYear', 'academicTerm']) {
    db[entity] = {
      findFirst: async ({ where }) => {
        if (entity === 'subject' || entity === 'class') {
          assert.equal(where.tenantId, scope.tenantId);
          assert.equal(where.schoolId, scope.schoolId);
        }
        return { id: where.id };
      },
    };
  }
  db.timetableSettings = {
    findUnique: async () => settings,
    upsert: async () => writes.push('settings'),
  };
  db.subjectPeriodRequirement = {
    findFirst: async ({ where }) => {
      assert.equal(where.schoolId, scope.schoolId);
      return { ...requirement, id: 'existing', minimumPeriods: 0 };
    },
    findMany: async () => [],
    create: async ({ data }) => {
      writes.push(data);
      return data;
    },
    update: async ({ data }) => {
      writes.push(data);
      return data;
    },
    deleteMany: async ({ where }) => {
      assert.deepEqual(where, { ...scope, id: 'existing' });
      return { count: 1 };
    },
  };
  return writes;
}

test('service creates scoped requirements and PATCH excludes its previous total', async () => {
  const writes = prepare();
  await service.createSubjectPeriodRequirement({ ...scope, ...requirement });
  assert.equal(writes[0].schoolId, scope.schoolId);
  db.subjectPeriodRequirement.findMany = async ({ where }) => {
    assert.deepEqual(where.id, { not: 'existing' });
    assert.equal(where.classId, requirement.classId);
    return [{ ...requirement, subjectId: 'subject-b', periodsPerWeek: 2 }];
  };
  await service.updateSubjectPeriodRequirement({ ...scope, id: 'existing', periodsPerWeek: 4 });
  await assert.rejects(
    service.updateSubjectPeriodRequirement({ ...scope, id: 'existing', periodsPerWeek: 5 }),
    /capacity/
  );
  assert.equal(writes.length, 2);
});

test('service rejects inaccessible entities, mismatched terms, and missing records before writing', async () => {
  for (const entity of ['subject', 'class', 'academicYear', 'academicTerm']) {
    const writes = prepare();
    db[entity].findFirst = async () => null;
    await assert.rejects(
      service.createSubjectPeriodRequirement({ ...scope, ...requirement }),
      /not found|does not belong/
    );
    assert.equal(writes.length, 0);
  }
  prepare();
  db.subjectPeriodRequirement.findFirst = async () => null;
  await assert.rejects(
    service.updateSubjectPeriodRequirement({ ...scope, id: 'missing', periodsPerWeek: 1 }),
    /not found/
  );
  await service.removeSubjectPeriodRequirement({ ...scope, id: 'existing' });
  db.subjectPeriodRequirement.deleteMany = async () => ({ count: 0 });
  await assert.rejects(
    service.removeSubjectPeriodRequirement({ ...scope, id: 'missing' }),
    /not found/
  );
});

test('settings cannot shrink below existing requirements and duplicate writes return validation errors', async () => {
  const writes = prepare();
  db.subjectPeriodRequirement.findMany = async () => [requirement];
  await assert.rejects(
    service.upsertTimetableSettings({ ...scope, ...settings, maxPeriodsPerDay: 1 }),
    /capacity/
  );
  assert.equal(writes.length, 0);
  prepare();
  db.subjectPeriodRequirement.create = async () => {
    throw Object.assign(new Error(), { code: 'P2002' });
  };
  await assert.rejects(
    service.createSubjectPeriodRequirement({ ...scope, ...requirement }),
    /already exists/
  );
});
