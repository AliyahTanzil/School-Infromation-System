import assert from 'node:assert/strict';
import test, { beforeEach, afterEach, mock } from 'node:test';
import dns from 'node:dns/promises';
import nodemailer from 'nodemailer';
import config from '../../src/config/index.js';
const prisma = {
  $on() {},
  school: { findMany() {} },
  tenantSetting: { findUnique() {} },
  $transaction() {},
};
globalThis.__prisma = prisma;
const { clearSingleSchoolCache } =
  await import('../../src/application/services/singleSchoolContextService.js');
const {
  createSmtpTransport,
  encryptSettings,
  decryptSettings,
  readSmtpSettings,
  saveSmtpSettings,
  smtpSchema,
} = await import('../../src/infrastructure/email/smtpSettings.js');
const { sendPasswordResetEmail } = await import('../../src/infrastructure/email/emailService.js');

const tenantId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';
const input = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  user: 'mail@example.com',
  password: 'provider-app-password',
  from: 'school@example.com',
  frontendUrl: 'https://school.example.com',
};
let row, verifyFailure, auditFailure, sent, transports, audit;
let previousKey;
beforeEach(() => {
  previousKey = process.env.SMTP_SETTINGS_KEY;
  process.env.SMTP_SETTINGS_KEY = 'test-encryption-key-with-at-least-32-characters';
  row = null;
  verifyFailure = false;
  auditFailure = false;
  sent = [];
  transports = [];
  audit = [];
  clearSingleSchoolCache();
  mock.method(dns, 'lookup', async () => [{ address: '8.8.8.8', family: 4 }]);
  mock.method(nodemailer, 'createTransport', (options) => {
    const transport = {
      options,
      closed: false,
      verify: async () => {
        if (verifyFailure) throw new Error(input.password);
      },
      close() {
        this.closed = true;
      },
      sendMail: async (message) => {
        sent.push(message);
        return { messageId: 'test' };
      },
    };
    transports.push(transport);
    return transport;
  });
  mock.method(prisma.school, 'findMany', async () => [{ id: actorId, tenantId }]);
  mock.method(prisma.tenantSetting, 'findUnique', async ({ where }) => {
    assert.equal(where.tenantId_key.tenantId, tenantId);
    return row;
  });
  mock.method(prisma, '$transaction', async (work) => {
    let pending;
    const result = await work({
      tenantSetting: {
        upsert: async ({ create, where }) => {
          assert.equal(where.tenantId_key.tenantId, tenantId);
          pending = { id: actorId, ...create, updatedAt: new Date() };
          return pending;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          if (auditFailure) throw new Error('Audit unavailable');
          audit.push(data);
        },
      },
    });
    row = pending;
    return result;
  });
});
afterEach(() => {
  mock.restoreAll();
  clearSingleSchoolCache();
  if (previousKey === undefined) delete process.env.SMTP_SETTINGS_KEY;
  else process.env.SMTP_SETTINGS_KEY = previousKey;
});

test('settings are encrypted, randomized, and bound to the school', () => {
  const encrypted = encryptSettings(input, tenantId);
  assert.deepEqual(decryptSettings(encrypted, tenantId), input);
  assert.notEqual(encrypted.ciphertext, encryptSettings(input, tenantId).ciphertext);
  assert.equal(JSON.stringify(encrypted).includes(input.password), false);
  assert.throws(() => decryptSettings(encrypted, actorId), /cannot be unlocked/);
  assert.throws(
    () => decryptSettings({ ...encrypted, tag: Buffer.alloc(16).toString('base64') }, tenantId),
    /cannot be unlocked/
  );
});
test('validation rejects unsafe hosts, ports, TLS mismatch, URL credentials and unknown fields', () => {
  for (const patch of [
    { host: 'localhost' },
    { host: '127.0.0.1' },
    { port: 25 },
    { secure: true },
    { secure: 'false' },
    { frontendUrl: 'https://user:secret@example.com' },
    { frontendUrl: 'https://example.com/reset-password' },
    { tenantId },
  ]) {
    assert.equal(smtpSchema.safeParse({ ...input, ...patch }).success, false);
  }
});
test('public transport pins DNS, verifies certificates, requires TLS and rejects private DNS answers', async () => {
  await createSmtpTransport(input);
  assert.equal(transports[0].options.host, '8.8.8.8');
  assert.equal(transports[0].options.requireTLS, true);
  assert.deepEqual(transports[0].options.tls, { servername: input.host, rejectUnauthorized: true });
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1']) {
    await assert.rejects(
      createSmtpTransport(input, async () => [{ address }]),
      /public SMTP/
    );
  }
  await assert.rejects(
    createSmtpTransport(input, async () => {
      throw new Error('DNS secret');
    }),
    /could not be resolved/
  );
});
test('verified settings and safe audit persist together without returning credentials', async () => {
  const result = await saveSmtpSettings(tenantId, actorId, input);
  assert.equal(result.password, undefined);
  assert.equal(result.passwordConfigured, true);
  assert.equal(result.source, 'database');
  assert.equal(JSON.stringify([row, audit, result]).includes(input.password), false);
  assert.equal(transports[0].closed, true);
  assert.deepEqual((await readSmtpSettings(tenantId)).settings, input);
});
test('failed SMTP verification preserves previous settings and redacts provider errors', async () => {
  await saveSmtpSettings(tenantId, actorId, input);
  const old = row;
  verifyFailure = true;
  await assert.rejects(
    saveSmtpSettings(tenantId, actorId, { ...input, password: 'new-password' }),
    (error) => error.code === 'SMTP_VERIFICATION_FAILED' && !error.message.includes(input.password)
  );
  assert.equal(row, old);
  assert.equal(transports.at(-1).closed, true);
});
test('audit failure rolls back the configuration', async () => {
  auditFailure = true;
  await assert.rejects(saveSmtpSettings(tenantId, actorId, input), /Audit unavailable/);
  assert.equal(row, null);
});
test('blank password retains existing secret only for the same host and username', async () => {
  await saveSmtpSettings(tenantId, actorId, input);
  await saveSmtpSettings(tenantId, actorId, { ...input, password: '' });
  assert.equal(transports.at(-1).options.auth.pass, input.password);
  await assert.rejects(
    saveSmtpSettings(tenantId, actorId, { ...input, host: 'another.example.com', password: '' }),
    /changing the server/
  );
  await assert.rejects(
    saveSmtpSettings(tenantId, actorId, { ...input, user: 'another', password: '' }),
    /changing the server/
  );
});
test('invalid scope makes no persistence calls', async () => {
  await assert.rejects(readSmtpSettings(undefined), /School context/);
  await assert.rejects(saveSmtpSettings(tenantId, undefined, input), /Authenticated school/);
  assert.equal(prisma.tenantSetting.findUnique.mock.callCount(), 0);
  assert.equal(prisma.$transaction.mock.callCount(), 0);
});
test('new recovery emails immediately use persisted sender, URL and updated credentials', async () => {
  await saveSmtpSettings(tenantId, actorId, input);
  await sendPasswordResetEmail({ to: 'recipient@example.com', token: 'test-token' });
  assert.equal(sent[0].from, input.from);
  assert.ok(sent[0].text.includes(`${input.frontendUrl}/reset-password?token=test-token`));
  await saveSmtpSettings(tenantId, actorId, {
    ...input,
    password: 'replacement',
    from: 'new@example.com',
  });
  await sendPasswordResetEmail({ to: 'recipient@example.com', token: 'second-token' });
  assert.equal(sent[1].from, 'new@example.com');
  assert.equal(transports.at(-1).options.auth.pass, 'replacement');
});
test('environment configuration remains the fallback when no saved row exists', async () => {
  const result = await readSmtpSettings(tenantId);
  assert.equal(result.source, 'environment');
  assert.equal(result.settings.host, config.email.host);
});
