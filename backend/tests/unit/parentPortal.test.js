import assert from 'node:assert/strict';
import test from 'node:test';
import { linkSchema, profileSchema } from '../../src/application/validators/parentValidators.js';

test('parent linking requires a UUID and relationship', () => {
  assert.throws(() => linkSchema.parse({ studentId: 'forged' }));
});

test('parent profile validation rejects ownership fields', () => {
  assert.throws(() =>
    profileSchema.parse({ firstName: 'A', lastName: 'Parent', schoolId: 'forged' })
  );
});
