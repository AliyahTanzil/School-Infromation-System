import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { signAccessToken, verifyAccessToken } from '../../src/infrastructure/auth/tokenService.js';

test('access tokens include an explicit access token type and validate it', () => {
  const token = signAccessToken({
    sub: 'user-id',
    email: 'user@example.com',
    sessionId: 'session-id',
  });
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, 'user-id');
  assert.equal(payload.sessionId, 'session-id');
});

test('refresh-style JWTs cannot be used as access tokens', () => {
  const token = jwt.sign(
    { tokenType: 'refresh', sid: 'session-id' },
    config.auth.accessTokenSecret,
    {
      subject: 'user-id',
      issuer: config.auth.issuer,
      audience: config.auth.audience,
      expiresIn: '5m',
    }
  );
  assert.throws(() => verifyAccessToken(token), /Invalid access token/);
});
