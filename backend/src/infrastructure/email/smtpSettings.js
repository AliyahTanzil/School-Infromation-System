import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import dns from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import config from '../../config/index.js';
import prisma from '../orm/prismaClient.js';
import { resolveSingleSchool } from '../../application/services/singleSchoolContextService.js';
import AppError from '../../shared/errors/AppError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const keyName = 'email.smtp.v1';
const failure = (message, code = 'SMTP_CONFIGURATION_ERROR') =>
  new AppError(message, { statusCode: 503, code });

export const smtpSchema = z
  .object({
    host: z
      .string()
      .trim()
      .min(3)
      .max(253)
      .regex(/^(?=.{3,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/),
    port: z.union([z.literal(465), z.literal(587)]),
    secure: z.boolean(),
    user: z
      .string()
      .trim()
      .min(1)
      .max(320)
      .refine(
        (value) => ![...value].some((character) => character.charCodeAt(0) < 32),
        'Username must not contain control characters.'
      ),
    password: z.string().max(4096).optional(),
    from: z.string().trim().email().max(320),
    frontendUrl: z
      .string()
      .trim()
      .url()
      .max(500)
      .refine((value) => {
        const url = new URL(value);
        return (
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash &&
          url.pathname === '/' &&
          (url.protocol === 'https:' ||
            (process.env.NODE_ENV !== 'production' &&
              url.protocol === 'http:' &&
              ['localhost', '127.0.0.1'].includes(url.hostname)))
        );
      }, 'Use the public HTTPS app origin (local HTTP is allowed in development).'),
  })
  .strict()
  .refine(
    (value) => value.secure === (value.port === 465),
    'Use TLS on port 465 or STARTTLS on port 587.'
  );

function encryptionKey(tenantId) {
  const secret = process.env.SMTP_SETTINGS_KEY || config.auth.refreshTokenSecret;
  if (!secret || secret.length < 32)
    throw failure(
      'A stable server secret of at least 32 characters is required to save email settings.'
    );
  return Buffer.from(hkdfSync('sha256', secret, tenantId, 'sais/email-settings/v1', 32));
}

export function encryptSettings(settings, tenantId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(tenantId), iv);
  cipher.setAAD(Buffer.from(`${tenantId}:${keyName}`));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(settings), 'utf8'),
    cipher.final(),
  ]);
  return {
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptSettings(value, tenantId) {
  try {
    if (value.version !== 1) throw new Error('Unsupported version');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(tenantId),
      Buffer.from(value.iv, 'base64')
    );
    decipher.setAAD(Buffer.from(`${tenantId}:${keyName}`));
    decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(value.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8')
    );
  } catch {
    throw failure(
      'Saved email settings cannot be unlocked. Restore the server encryption key or enter and save all settings again.'
    );
  }
}

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
])
  blocked.addSubnet(address, prefix);

// Resolve and pin a public address so an administrator-supplied host cannot reach
// local services or change its DNS answer between validation and connection.
export async function createSmtpTransport(settings, resolve = dns.lookup) {
  let addresses;
  try {
    addresses = await resolve(settings.host, { all: true, family: 4 });
  } catch {
    throw failure(
      'The SMTP server could not be resolved. Check the server name.',
      'SMTP_DNS_FAILED'
    );
  }
  if (
    !addresses.length ||
    addresses.some(({ address }) => isIP(address) !== 4 || blocked.check(address))
  ) {
    throw new ValidationError('Choose a public SMTP server with an IPv4 address.');
  }
  return nodemailer.createTransport({
    host: addresses[0].address,
    port: settings.port,
    secure: settings.secure,
    requireTLS: !settings.secure,
    tls: { servername: settings.host, rejectUnauthorized: true },
    auth: { user: settings.user, pass: settings.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: false,
    debug: false,
  });
}

export function safeSettings(settings, source, updatedAt = null) {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
    from: settings.from,
    frontendUrl: settings.frontendUrl,
    passwordConfigured: Boolean(settings.password),
    configured: Boolean(settings.host),
    source,
    updatedAt,
  };
}

function environmentSettings() {
  return { ...config.email, frontendUrl: config.frontendUrl };
}

export async function readSmtpSettings(tenantId) {
  if (!z.string().uuid().safeParse(tenantId).success)
    throw new ValidationError('School context is required.');
  const row = await prisma.tenantSetting.findUnique({
    where: { tenantId_key: { tenantId, key: keyName } },
  });
  return row
    ? {
        settings: decryptSettings(row.value, tenantId),
        source: 'database',
        updatedAt: row.updatedAt,
      }
    : { settings: environmentSettings(), source: 'environment', updatedAt: null };
}

export async function getEffectiveEmailSettings() {
  const school = await resolveSingleSchool();
  return readSmtpSettings(school.tenantId);
}

export async function saveSmtpSettings(tenantId, actorId, input) {
  if (
    !z.string().uuid().safeParse(tenantId).success ||
    !z.string().uuid().safeParse(actorId).success
  )
    throw new ValidationError('Authenticated school context is required.');
  const parsed = smtpSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Check the email settings fields.');
  const settings = { ...parsed.data, frontendUrl: parsed.data.frontendUrl.replace(/\/$/, '') };
  if (!settings.password) {
    const current = await readSmtpSettings(tenantId);
    if (settings.host !== current.settings.host || settings.user !== current.settings.user) {
      throw new ValidationError('Enter the SMTP password when changing the server or username.');
    }
    settings.password = current.settings.password;
  }
  if (!settings.password)
    throw new ValidationError('Enter the SMTP password or provider app password.');
  const value = encryptSettings(settings, tenantId);
  const transport = await createSmtpTransport(settings);
  try {
    await transport.verify();
  } catch {
    throw failure(
      'SMTP connection failed. Check the server, encryption mode, username and password. Previous settings are unchanged.',
      'SMTP_VERIFICATION_FAILED'
    );
  } finally {
    transport.close();
  }
  const row = await prisma.$transaction(async (tx) => {
    const saved = await tx.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key: keyName } },
      create: { tenantId, key: keyName, value },
      update: { value },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: 'UPDATE',
        entityType: 'SmtpSettings',
        entityId: saved.id,
        metadata: { connectionVerified: true },
      },
    });
    return saved;
  });
  return safeSettings(settings, 'database', row.updatedAt);
}

export default { getEffectiveEmailSettings };
