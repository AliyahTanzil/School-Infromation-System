import assert from 'node:assert/strict';
import test from 'node:test';
import { toPositiveInt } from '../../src/config/index.js';

test('authentication protection settings accept only explicit positive integers', () => {
  assert.equal(toPositiveInt(undefined, 5, 'LIMIT'), 5);
  assert.equal(toPositiveInt('', 5, 'LIMIT'), 5);
  assert.equal(toPositiveInt(' 25 ', 5, 'LIMIT'), 25);

  for (const value of ['0', '-1', '1.5', '5minutes', 'Infinity', '9007199254740992']) {
    assert.throws(() => toPositiveInt(value, 5, 'LIMIT'), /LIMIT must be a positive integer/);
  }
});
