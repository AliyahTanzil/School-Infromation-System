import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import config from '../../src/config/index.js';
import logger from '../../src/infrastructure/logger/index.js';
import smtpSettings from '../../src/infrastructure/email/smtpSettings.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../src/infrastructure/email/emailService.js';

test('development auth emails retain usable links without logging bearer tokens or bodies', async (t) => {
  const originalHost = config.email.host;
  config.email.host = '';
  const settingsMock = mock.method(smtpSettings, 'getEffectiveEmailSettings', async () => ({
    settings: { ...config.email, frontendUrl: config.frontendUrl },
    source: 'environment',
  }));
  const logs = [];
  const log = mock.method(logger, 'info', (...args) => logs.push(args));
  t.after(() => {
    config.email.host = originalHost;
    log.mock.restore();
    settingsMock.mock.restore();
  });

  for (const [send, route] of [
    [sendPasswordResetEmail, 'reset-password'],
    [sendVerificationEmail, 'verify-email'],
  ]) {
    const token = `secret-${route}-with+reserved/chars?&`;
    const result = await send({ to: 'recipient@example.test', token });
    const message = JSON.parse(result.message);
    const url = `${config.frontendUrl}/${route}?token=${encodeURIComponent(token)}`;
    assert.ok(message.text.includes(url));
    assert.ok(message.html.includes(url));
    assert.equal(message.to[0].address, 'recipient@example.test');
    const serializedLogs = JSON.stringify(logs);
    assert.equal(serializedLogs.includes(token), false);
    assert.equal(serializedLogs.includes(encodeURIComponent(token)), false);
    assert.equal(serializedLogs.includes('preview'), false);
    assert.equal(serializedLogs.includes('<html>'), false);
  }
  assert.equal(logs.length, 2);
  for (const [, metadata] of logs) {
    assert.deepEqual(Object.keys(metadata).sort(), ['subject', 'to']);
  }
});
