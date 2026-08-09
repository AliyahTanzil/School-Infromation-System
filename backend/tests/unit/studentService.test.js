import assert from 'node:assert/strict';
import test from 'node:test';
import { statusSchema } from '../../src/application/validators/studentValidators.js';

test('student lifecycle validation accepts controlled statuses', () => {
  assert.equal(statusSchema.parse({ status: 'ACTIVE' }).status, 'ACTIVE');
});

test('student status validation ignores forged school context fields', () => {
  const parsed = statusSchema.parse({ status: 'ACTIVE', schoolId: 'forged' });
  assert.equal(Object.hasOwn(parsed, 'schoolId'), false);
});
