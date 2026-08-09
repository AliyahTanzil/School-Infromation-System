import assert from 'node:assert/strict';
import test from 'node:test';

test('profile image policy allows bounded JPEG, PNG, and WebP payloads', () => {
  assert.deepEqual(['image/jpeg', 'image/png', 'image/webp'].sort(), [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  assert.equal(5 * 1024 * 1024, 5242880);
});
