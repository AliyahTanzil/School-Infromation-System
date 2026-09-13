/**
 * SEC-001 Phase 69 — Production secret safety regressions.
 *
 * 1. Weak or placeholder JWT secrets must cause a hard startup failure in
 *    production; development always proceeds regardless of secret strength.
 * 2. The user-creation duplicate-email check must be scoped to the authenticated
 *    tenant so cross-school identity leakage is impossible.
 * 3. The frontend API module stores access tokens only in module-level memory —
 *    never in localStorage or sessionStorage.
 * 4. The body refresh-token fallback is disabled by default.
 *
 * NOTE: the test runner executes from inside `backend/` so paths relative to
 * `process.cwd()` resolve there. Frontend paths must go up one level (`../`).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Weak-secret startup guard
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_WEAK_PATTERNS = [
  /^change.?me/i,
  /^your.?secret/i,
  /^secret/i,
  /^password/i,
  /^example/i,
  /^placeholder/i,
  /^replace.?me/i,
  /do.?not.?use.?in.?production/i,
  /local.?only/i,
  /dev(elopment)?/i,
  /test/i,
  /^sais-local/i,
];

function isWeakSecret(value) {
  if (!value || String(value).trim().length < 32) return true;
  const str = String(value).trim();
  return KNOWN_WEAK_PATTERNS.some((p) => p.test(str));
}

test('rejects an empty secret as weak', () => {
  assert.equal(isWeakSecret(''), true);
  assert.equal(isWeakSecret(undefined), true);
  assert.equal(isWeakSecret(null), true);
});

test('rejects secrets shorter than 32 characters', () => {
  assert.equal(isWeakSecret('short-secret'), true);
  // Exactly 31 chars should fail.
  assert.equal(isWeakSecret('a'.repeat(31)), true);
  // Exactly 32 chars with no weak pattern should pass.
  assert.equal(isWeakSecret('a'.repeat(32)), false);
});

test('rejects known development placeholder secrets', () => {
  const bad = [
    'sais-local-access-secret-2026-do-not-use-in-production',
    'sais-local-refresh-secret-2026-do-not-use-in-production',
    'test-secret-value-that-is-at-least-32-characters-long',
    'changeme-this-is-a-very-long-placeholder-value-for-testing',
    'development-secret-do-not-use-in-production-please',
  ];
  for (const secret of bad) {
    assert.equal(isWeakSecret(secret), true, `Expected "${secret}" to be rejected as weak`);
  }
});

test('accepts a sufficiently strong and non-placeholder secret', () => {
  // 64 random-looking hex characters — no placeholder pattern.
  const strong = 'f8a3c2d1e0b7a9642f1c3e5d8a0b2c4d6e8f0a1b3c5d7e9f2a4b6c8d0e2f4a6b8';
  assert.equal(isWeakSecret(strong), false);
});

test('config source contains the production secret validation function', () => {
  const src = readFileSync(resolve(join(process.cwd(), 'src/config/index.js')), 'utf8');
  assert.ok(src.includes('isWeakSecret'), 'config/index.js should define the isWeakSecret guard');
  assert.ok(
    src.includes('KNOWN_WEAK_SECRET_PATTERNS'),
    'config/index.js should define KNOWN_WEAK_SECRET_PATTERNS'
  );
  assert.ok(
    src.includes('weak.length > 0'),
    'config/index.js should throw when weak secrets are detected in production'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cross-tenant email scope in user management
// ─────────────────────────────────────────────────────────────────────────────

test('user management createUser scopes duplicate-email lookup to the tenant', () => {
  const src = readFileSync(
    resolve(join(process.cwd(), 'src/application/services/userManagementService.js')),
    'utf8'
  );
  // The email uniqueness check must include tenantId so callers cannot confirm
  // whether an email exists in a different school tenant.
  assert.ok(
    src.includes('{ email, tenantId }') || src.includes('{ email: email, tenantId: tenantId }'),
    'createUser must scope the duplicate-email findFirst query to tenantId'
  );
});

test('user management createUser does not use a global email uniqueness check', () => {
  const src = readFileSync(
    resolve(join(process.cwd(), 'src/application/services/userManagementService.js')),
    'utf8'
  );
  // The old unscoped lookup was: prisma.user.findFirst({ where: { email } })
  // without tenantId. Confirm it is no longer present.
  assert.ok(
    !src.includes('where: { email }'),
    'createUser must not use an unscoped { where: { email } } lookup'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Frontend token storage — no localStorage / sessionStorage
// ─────────────────────────────────────────────────────────────────────────────

test('frontend auth module does not write access tokens to localStorage', () => {
  const src = readFileSync(resolve(join(process.cwd(), '../frontend/src/api/auth.js')), 'utf8');
  assert.ok(
    !src.includes('localStorage.setItem'),
    'auth.js must not persist tokens in localStorage'
  );
  assert.ok(
    !src.includes('localStorage.getItem'),
    'auth.js must not read tokens from localStorage'
  );
});

test('frontend auth module does not write access tokens to sessionStorage', () => {
  const src = readFileSync(resolve(join(process.cwd(), '../frontend/src/api/auth.js')), 'utf8');
  assert.ok(
    !src.includes('sessionStorage.setItem'),
    'auth.js must not persist tokens in sessionStorage'
  );
  assert.ok(
    !src.includes('sessionStorage.getItem'),
    'auth.js must not read tokens from sessionStorage'
  );
});

test('frontend auth module uses a module-level memory variable for the access token', () => {
  const src = readFileSync(resolve(join(process.cwd(), '../frontend/src/api/auth.js')), 'utf8');
  assert.ok(
    src.includes('let accessToken'),
    'auth.js should declare a module-level accessToken variable'
  );
  assert.ok(
    src.includes('setAccessToken'),
    'auth.js should export a setAccessToken setter for test/refresh use'
  );
});

test('frontend AuthContext does not store the user token outside React state', () => {
  const src = readFileSync(
    resolve(join(process.cwd(), '../frontend/src/context/AuthContext.jsx')),
    'utf8'
  );
  assert.ok(
    !src.includes('localStorage'),
    'AuthContext.jsx must not store auth state in localStorage'
  );
  assert.ok(
    !src.includes('sessionStorage'),
    'AuthContext.jsx must not store auth state in sessionStorage'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Body refresh-token fallback is disabled by default
// ─────────────────────────────────────────────────────────────────────────────

test('cookies helper reads refresh token from body only when ALLOW_BODY_REFRESH_TOKEN is set', () => {
  const src = readFileSync(resolve(join(process.cwd(), 'src/shared/utils/cookies.js')), 'utf8');
  assert.ok(
    src.includes('ALLOW_BODY_REFRESH_TOKEN'),
    'cookies.js must gate body refresh token fallback on ALLOW_BODY_REFRESH_TOKEN'
  );
  // The default must be false — body token should NOT be accepted by default.
  assert.ok(
    src.includes("=== 'true'"),
    'ALLOW_BODY_REFRESH_TOKEN must default to false (only explicitly "true" enables it)'
  );
});
