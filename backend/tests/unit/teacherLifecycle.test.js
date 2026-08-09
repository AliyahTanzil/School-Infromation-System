import assert from 'node:assert/strict';
import test from 'node:test';
import { assertTransition, canTransition } from '../../src/domain/teacherLifecycle.js';

test('allows supported teacher transitions', () => {
  assert.equal(canTransition('APPLICANT', 'ACTIVE'), true);
  assert.equal(canTransition('ACTIVE', 'ON_LEAVE'), true);
  assert.equal(canTransition('ACTIVE', 'RETIRED'), true);
});
test('rejects terminal and invalid transitions', () => {
  assert.equal(canTransition('TERMINATED', 'ACTIVE'), false);
  assert.throws(() => assertTransition('APPLICANT', 'RETIRED'), /Invalid teacher status/);
});
