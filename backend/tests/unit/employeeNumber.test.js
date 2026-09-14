import assert from 'node:assert/strict';
import test from 'node:test';
import { generateEmployeeNumber } from '../../src/domain/employeeNumber.js';
import { teacherCreateSchema } from '../../src/application/validators/teacherValidators.js';

test('generates distinct employee numbers from normalized teacher initials', () => {
  const profile = { firstName: ' Émile ', lastName: 'Johnson' };
  const first = generateEmployeeNumber(profile);
  assert.match(first, /^T-EJ-[A-F0-9]{32}$/);
  assert.notEqual(first, generateEmployeeNumber(profile));
  assert.ok(first.length <= 60);
});

test('supports names without Latin initials', () => {
  assert.match(generateEmployeeNumber({ firstName: '李', lastName: '明' }), /^T-EMP-[A-F0-9]{32}$/);
});

test('creation accepts omitted or blank numbers and preserves supplied legacy numbers', () => {
  const profile = { firstName: 'Real', lastName: 'Teacher' };
  for (const employeeNumber of [undefined, '', '  ', 'LEGACY-42']) {
    const { body } = teacherCreateSchema.parse({ body: { profile, employeeNumber } });
    assert.equal(body.employeeNumber, employeeNumber?.trim());
  }
});
