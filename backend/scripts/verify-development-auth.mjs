import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise only local development accounts. Never print credentials or tokens.
if (process.env.NODE_ENV === 'production') throw new Error('Development verification only');
const ports = JSON.parse(
  await readFile(new URL('../../.sais-ports.json', import.meta.url), 'utf8')
);
const port = Number(process.env.SAIS_VERIFY_BACKEND_PORT ?? ports.backend);
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Invalid local backend port');
const base = `http://localhost:${port}/api/v1`;
const accounts = [
  ['ADMIN', 'school-admin@example.test', 'TENANT_ADMIN'],
  ['TEACHER', 'teacher@example.test', 'TEACHER'],
  ['STUDENT', 'student@example.test', 'STUDENT'],
  ['PARENT', 'parent@example.test', 'PARENT'],
];

async function request(path, options = {}, retries = 0) {
  const { token, cookie, body, method = 'GET' } = options;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json();
  if (response.status >= 500) {
    const safeLabel = (value) =>
      typeof value === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : 'unavailable';
    console.error(
      `${method} ${path}: HTTP ${response.status}; code=${safeLabel(payload.error?.code)}; requestId=${safeLabel(response.headers.get('x-request-id'))}`
    );
  }
  if (response.status === 429 && retries < 2) {
    const seconds = Number(response.headers.get('retry-after'));
    if (Number.isFinite(seconds) && seconds > 0 && seconds <= 300) {
      console.log(`Rate limit reached; respecting Retry-After (${seconds}s)`);
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 1000));
      return request(path, options, retries + 1);
    }
  }
  return { response, payload };
}

const selectedRole = process.argv[2]?.toUpperCase();
if (selectedRole && !accounts.some(([role]) => role === selectedRole)) {
  throw new Error('Select ADMIN, TEACHER, STUDENT, or PARENT');
}
for (const [role, fallback, accountType] of accounts.filter(
  ([role]) => !selectedRole || selectedRole === role
)) {
  let token;
  try {
    const email = (process.env[`SAIS_DEV_${role}_EMAIL`] || fallback).trim().toLowerCase();
    const password =
      process.env[`SAIS_DEV_${role}_PASSWORD`] ||
      process.env.SAIS_DEV_ACCOUNT_PASSWORD ||
      'ChangeMe!2026';
    const login = await request('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(login.response.status, 200, `${role}: login`);
    token = login.payload.data.accessToken;
    assert.ok(token, `${role}: access token missing`);
    assert.equal(login.payload.data.user.accountType, accountType);
    const original = login.response.headers.get('set-cookie');
    assert.match(original ?? '', /httponly/i);
    assert.equal(login.payload.data.refreshToken, undefined);
    const refresh = await request('/auth/refresh', {
      method: 'POST',
      body: {},
      cookie: original.split(';')[0],
    });
    assert.equal(refresh.response.status, 200, `${role}: refresh`);
    token = refresh.payload.data.accessToken;
    const rotated = refresh.response.headers.get('set-cookie');
    assert.ok(rotated, `${role}: rotated cookie missing`);
    assert.notEqual(rotated.split(';')[0], original.split(';')[0]);
    assert.equal((await request('/auth/me', { token })).response.status, 200, `${role}: identity`);
    const school = await request('/school', { token });
    assert.equal(school.response.status, 200, `${role}: school context`);
    const resolvedSchool = school.payload.data?.school ?? school.payload.data;
    assert.ok(resolvedSchool?.id, `${role}: missing school`);
    if (process.env.SINGLE_SCHOOL_ID?.trim()) {
      assert.equal(resolvedSchool.id, process.env.SINGLE_SCHOOL_ID.trim());
    }
    assert.equal((await request('/auth/logout', { method: 'POST', token })).response.status, 200);
    assert.equal(
      (await request('/auth/me', { token })).response.status,
      401,
      `${role}: revoked access`
    );
    token = undefined;
    assert.equal(
      (
        await request('/auth/refresh', {
          method: 'POST',
          body: {},
          cookie: rotated.split(';')[0],
        })
      ).response.status,
      401,
      `${role}: revoked refresh`
    );
    console.log(
      `${role}: login, cookie rotation, identity, configured school, logout and revocation PASS`
    );
  } catch (error) {
    console.error(
      `${role}: FAIL (${error instanceof assert.AssertionError ? error.message : error.name})`
    );
    process.exitCode = 1;
  } finally {
    if (token) await request('/auth/logout', { method: 'POST', token }).catch(() => {});
  }
}
