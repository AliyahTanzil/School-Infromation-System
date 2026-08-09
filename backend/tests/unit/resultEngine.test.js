import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateGrade,
  calculateResult,
  nextResultStatus,
  rankResults,
} from '../../src/domain/resultEngine.js';

const bands = [
  { label: 'A', minMark: 80, maxMark: 100, point: 4 },
  { label: 'F', minMark: 0, maxMark: 49, point: 0 },
];

test('calculates deterministic totals and grade', () =>
  assert.deepStrictEqual(
    calculateResult({ marks: [{ score: 90 }, { score: 70 }], bands, passMark: 50 }),
    { total: 160, average: 80, grade: 'A', gradePoint: 4, studentStatus: 'PASS' }
  ));
test('ranks highest total first', () =>
  assert.equal(rankResults([{ total: 5 }, { total: 9 }])[0].position, 1));
test('rejects invalid lifecycle transitions', () =>
  assert.throws(() => nextResultStatus('LOCKED', 'PUBLISHED')));
test('uses configurable grade bands', () => assert.equal(calculateGrade(85, bands).grade, 'A'));
