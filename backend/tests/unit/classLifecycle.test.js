import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCapacity, assertClassTransition } from '../../src/domain/classLifecycle.js';

test('class lifecycle allows planned to active', () =>
  assert.doesNotThrow(() => assertClassTransition('PLANNED', 'ACTIVE')));
test('class lifecycle rejects archived to active', () =>
  assert.throws(() => assertClassTransition('ARCHIVED', 'ACTIVE')));
test('class capacity rejects over-enrollment', () => assert.throws(() => assertCapacity(20, 21)));
