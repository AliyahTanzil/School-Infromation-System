import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertAcademicPeriodRange,
  assertAcademicTransition,
  isLocked,
} from '../../src/domain/academicPeriodLifecycle.js';

test('rejects reversed academic period ranges', () =>
  assert.throws(() => assertAcademicPeriodRange(new Date('2026-01-02'), new Date('2026-01-01'))));
test('allows planned to active', () =>
  assert.doesNotThrow(() => assertAcademicTransition('PLANNED', 'ACTIVE')));
test('rejects reopening a closed period', () =>
  assert.throws(() => assertAcademicTransition('CLOSED', 'ACTIVE')));
test('recognizes locked periods', () =>
  assert.equal(isLocked({ status: 'CLOSED', lockedAt: null }), true));
