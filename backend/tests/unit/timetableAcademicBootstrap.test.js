import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ensureScience3aAcademicFoundation,
  science3aPlan,
} from '../../src/application/services/timetableAcademicBootstrapService.js';

test('idempotently creates the documented SSS Science 3A academic foundation', async () => {
  const calls = [];
  let sequence = 0;
  const upsert = (model) => async (args) => {
    calls.push({ model, args });
    return { id: `${model}-${++sequence}`, ...args.create };
  };
  const db = {
    $transaction: (operation) => operation(db),
    school: {
      findUnique: async () => ({ id: 'school-id', tenantId: 'tenant-id', name: 'Academy' }),
    },
    academicYear: { upsert: upsert('year') },
    academicTerm: { upsert: upsert('term') },
    gradeLevel: { upsert: upsert('grade') },
    class: { upsert: upsert('class') },
    subject: { upsert: upsert('subject') },
    classSubject: { upsert: upsert('classSubject') },
  };

  const result = await ensureScience3aAcademicFoundation({ schoolId: 'school-id' }, db);
  assert.equal(result.class.name, 'SSS Science 3A');
  assert.equal(result.class.capacity, 40);
  assert.deepEqual(
    result.subjects.map(({ name }) => name),
    science3aPlan.subjects.map(([, name]) => name)
  );
  assert.equal(calls.filter(({ model }) => model === 'subject').length, 9);
  assert.equal(calls.filter(({ model }) => model === 'classSubject').length, 9);
  assert.ok(calls.every(({ args }) => Object.keys(args.update).length === 0));
});

test('does not write when the configured school is missing', async () => {
  const db = {
    $transaction: (operation) => operation(db),
    school: { findUnique: async () => null },
  };
  await assert.rejects(
    () => ensureScience3aAcademicFoundation({ schoolId: 'missing' }, db),
    /was not found/
  );
});
