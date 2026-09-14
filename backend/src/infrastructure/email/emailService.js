import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from '../logger/index.js';
import smtpSettings, { createSmtpTransport } from './smtpSettings.js';
import AppError from '../../shared/errors/AppError.js';

/**
 * EmailService
 *
 * Sends transactional auth emails (verification, password reset, security
 * notifications). When no SMTP host is configured (local/dev/test), it falls
 * back to a JSON transport without delivering mail. Rendered messages are
 * returned to the caller, never logged, because they contain bearer tokens.
 */

function getEnvironmentTransport(settings) {
  if (settings.host) {
    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user ? { user: settings.user, pass: settings.password } : undefined,
    });
  } else {
    // Dev/test fallback: no real delivery; callers can inspect the returned message.
    return nodemailer.createTransport({ jsonTransport: true });
  }
}

async function send({ to, subject, html, text }, effective) {
  const { settings, source } = effective;
  const transport =
    source === 'database' ? await createSmtpTransport(settings) : getEnvironmentTransport(settings);
  let info;
  try {
    info = await transport.sendMail({
      from: settings.from,
      to,
      subject,
      text,
      html,
    });
  } catch {
    throw new AppError(
      'Email delivery failed. Check the saved email connection and sender approval.',
      { statusCode: 503, code: 'EMAIL_DELIVERY_FAILED' }
    );
  } finally {
    transport.close();
  }

  if (!settings.host) {
    logger.info('Email (dev transport — not delivered)', {
      to,
      subject,
    });
  } else {
    logger.info('Email sent', { to, subject, messageId: info.messageId });
  }
  return info;
}

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="font-size:12px;color:#64748b;margin:0">School Administration Information System</p>
    </div></body></html>`;
}

/**
 * @param {{ to: string, token: string }} params
 */
export async function sendVerificationEmail({ to, token }) {
  const effective = await smtpSettings.getEffectiveEmailSettings();
  const url = `${effective.settings.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    {
      to,
      subject: 'Verify your SAIS email address',
      text: `Confirm your email by visiting: ${url}`,
      html: layout(
        'Confirm your email address',
        `<p>Welcome to SAIS. Please confirm your email address to activate your account.</p>
       <p><a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px">Verify email</a></p>
       <p style="font-size:12px;color:#64748b">This link expires in ${config.auth.emailVerificationTtlHours} hours.</p>`
      ),
    },
    effective
  );
}

/**
 * @param {{ to: string, token: string }} params
 */
export async function sendPasswordResetEmail({ to, token }) {
  const effective = await smtpSettings.getEffectiveEmailSettings();
  const url = `${effective.settings.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    {
      to,
      subject: 'Reset your SAIS password',
      text: `Reset your password by visiting: ${url}`,
      html: layout(
        'Reset your password',
        `<p>We received a request to reset your password. If this was you, click below to choose a new one.</p>
       <p><a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px">Reset password</a></p>
       <p style="font-size:12px;color:#64748b">This link expires in ${config.auth.passwordResetTtlMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`
      ),
    },
    effective
  );
}

export default { sendVerificationEmail, sendPasswordResetEmail };
