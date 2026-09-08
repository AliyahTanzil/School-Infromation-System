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

function signedClaims(claims, options = {}) {
  return jwt.sign(claims, config.auth.accessTokenSecret, {
    issuer: config.auth.issuer,
    audience: config.auth.audience,
    ...options,
  });
}

const validClaims = () => ({
  tokenType: 'access',
  sub: 'user',
  sid: 'session',
  exp: Math.floor(Date.now() / 1000) + 300,
});

test('legacy sid-only access tokens with expiry remain valid', () => {
  assert.equal(verifyAccessToken(signedClaims(validClaims())).sessionId, 'session');
});

test('signed access tokens must expire', () => {
  const claims = validClaims();
  delete claims.exp;
  assert.throws(() => verifyAccessToken(signedClaims(claims)), /Invalid access token/);
});

for (const claims of [
  { sub: '' },
  { sub: '  ' },
  { sid: '' },
  { sid: '  ' },
  { sessionId: 'different-session' },
  { sessionId: null },
  { sessionId: 42 },
]) {
  test(`rejects malformed access identity ${JSON.stringify(claims)}`, () => {
    assert.throws(
      () => verifyAccessToken(signedClaims({ ...validClaims(), ...claims })),
      /Invalid access token/
    );
  });
}

test('access tokens accept only the algorithm used by the issuer', () => {
  assert.throws(
    () => verifyAccessToken(signedClaims(validClaims(), { algorithm: 'HS384' })),
    /invalid algorithm/
  );
});

test('expired tokens and wrong issuer or audience are rejected', () => {
  assert.throws(() => verifyAccessToken(signedClaims({ ...validClaims(), exp: 1 })), /expired/);
  assert.throws(
    () => verifyAccessToken(signedClaims(validClaims(), { issuer: 'other' })),
    /issuer invalid/
  );
  assert.throws(
    () => verifyAccessToken(signedClaims(validClaims(), { audience: 'other' })),
    /audience invalid/
  );
});
