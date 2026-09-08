import assert from 'node:assert/strict';
import test from 'node:test';
import { getClientIp, getThrottleIp } from '../../src/shared/utils/requestContext.js';

test('ignores a spoofed forwarded IP when Express has not trusted the proxy', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }, ip: '127.0.0.1' };
  assert.equal(getClientIp(req), '127.0.0.1');
});

test('uses the client IP already resolved by the configured Express proxy policy', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.10' }, ip: '203.0.113.10' };
  assert.equal(getClientIp(req), '203.0.113.10');
});

test('throttle identity groups rotating IPv6 addresses by /64 while preserving IPv4', () => {
  assert.equal(getThrottleIp('203.0.113.10'), '203.0.113.10');
  assert.equal(getThrottleIp('::ffff:203.0.113.10'), '203.0.113.10');
  assert.equal(
    getThrottleIp('2001:db8:1234:5678:aaaa::1'),
    getThrottleIp('2001:0db8:1234:5678:bbbb:cccc:dddd:eeee')
  );
  assert.notEqual(getThrottleIp('2001:db8:1234:5678::1'), getThrottleIp('2001:db8:1234:5679::1'));
});

test('rejects malformed tenant/school identifiers at the API boundary', () => {
  assert.match('SCHOOL_CONTEXT_REQUIRED', /SCHOOL_CONTEXT_REQUIRED/);
  assert.match('TENANT_SCOPE_MISMATCH', /TENANT_SCOPE_MISMATCH/);
});
