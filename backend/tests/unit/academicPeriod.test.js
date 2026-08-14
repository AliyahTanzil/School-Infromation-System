import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertAcademicPeriodRange,
  assertAcademicTransition,
} from '../../src/domain/academicPeriodLifecycle.js';

test('academic periods reject inverted ranges', () => {
  assert.throws(() => assertAcademicPeriodRange(new Date('2027-01-01'), new Date('2026-01-01')));
});

test('academic lifecycle only permits forward transitions', () => {
  assert.doesNotThrow(() => assertAcademicTransition('PLANNED', 'ACTIVE'));
  assert.throws(() => assertAcademicTransition('CLOSED', 'ACTIVE'));
});
