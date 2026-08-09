import test from 'node:test';
import assert from 'node:assert/strict';
import { assertExaminationTransition, assertScore } from '../../src/domain/examinationLifecycle.js';

test('examination lifecycle advances in order', () => {
  assert.doesNotThrow(() => assertExaminationTransition('DRAFT', 'SCHEDULED'));
  assert.throws(
    () => assertExaminationTransition('DRAFT', 'LOCKED'),
    /Invalid examination transition/
  );
});

test('scores are bounded by max score', () => {
  assert.doesNotThrow(() => assertScore(75, 100));
  assert.throws(() => assertScore(101, 100), /between zero/);
});
