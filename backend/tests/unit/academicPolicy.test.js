import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertBands,
  assertWeights,
  nextAcademicPolicyStatus,
} from '../../src/domain/academicPolicy.js';

test('academic policy accepts complete grade bands and weights', () => {
  assert.doesNotThrow(() =>
    assertBands([
      { label: 'F', minMark: 0, maxMark: 49.99 },
      { label: 'P', minMark: 50, maxMark: 100 },
    ])
  );
  assert.doesNotThrow(() => assertWeights([{ weight: 40 }, { weight: 60 }]));
});
test('academic policy rejects incomplete weights and invalid transitions', () => {
  assert.throws(() => assertWeights([{ weight: 80 }]));
  assert.throws(() => nextAcademicPolicyStatus('ARCHIVED', 'ACTIVE'));
  assert.equal(nextAcademicPolicyStatus('DRAFT', 'ACTIVE'), 'ACTIVE');
});
