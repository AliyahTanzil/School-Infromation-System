import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

const { default: passwordService } =
  await import('../../src/infrastructure/hash/passwordService.js');
const { default: tokenService } = await import('../../src/infrastructure/auth/tokenService.js');
const { hashToken, generateOpaqueToken } = await import('../../src/shared/utils/tokenUtils.js');

test('hashes and verifies passwords', async () => {
  const password = 'StrongPassword123!';
  const hash = await passwordService.hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await passwordService.verifyPassword(password, hash), true);
  assert.equal(await passwordService.verifyPassword('wrong-password', hash), false);
});

test('creates verifiable access tokens with claims', () => {
  const token = tokenService.signAccessToken({
    sub: 'user-1',
    email: 'user@example.com',
    sessionId: 'session-1',
    roles: ['ADMIN'],
  });
  const claims = tokenService.verifyAccessToken(token);
  assert.equal(claims.sub, 'user-1');
  assert.equal(claims.sid, 'session-1');
  assert.deepEqual(claims.roles, ['ADMIN']);
});

test('generates opaque tokens and stable hashes', () => {
  const token = generateOpaqueToken();
  assert.equal(token.length, 64);
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), hashToken(generateOpaqueToken()));
});
