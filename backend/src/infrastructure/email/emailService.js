import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from '../logger/index.js';

/**
 * EmailService
 *
 * Sends transactional auth emails (verification, password reset, security
 * notifications). When no SMTP host is configured (local/dev/test), it falls
 * back to a JSON "stream" transport that logs the rendered message instead of
 * delivering it — so every flow is exercisable end-to-end without a mail server.
 */

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  if (config.email.host) {
    cachedTransport = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.user
        ? { user: config.email.user, pass: config.email.password }
        : undefined,
    });
  } else {
    // Dev/test fallback: no real delivery, message captured in logs.
    cachedTransport = nodemailer.createTransport({ jsonTransport: true });
  }
  return cachedTransport;
}

async function send({ to, subject, html, text }) {
  const transport = getTransport();
  const info = await transport.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    html,
  });

  if (!config.email.host) {
    logger.info('Email (dev transport — not delivered)', {
      to,
      subject,
      preview: info.message?.toString?.() ?? undefined,
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
  const url = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return send({
    to,
    subject: 'Verify your SAIS email address',
    text: `Confirm your email by visiting: ${url}`,
    html: layout(
      'Confirm your email address',
      `<p>Welcome to SAIS. Please confirm your email address to activate your account.</p>
       <p><a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px">Verify email</a></p>
       <p style="font-size:12px;color:#64748b">This link expires in ${config.auth.emailVerificationTtlHours} hours.</p>`
    ),
  });
}

/**
 * @param {{ to: string, token: string }} params
 */
export async function sendPasswordResetEmail({ to, token }) {
  const url = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return send({
    to,
    subject: 'Reset your SAIS password',
    text: `Reset your password by visiting: ${url}`,
    html: layout(
      'Reset your password',
      `<p>We received a request to reset your password. If this was you, click below to choose a new one.</p>
       <p><a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px">Reset password</a></p>
       <p style="font-size:12px;color:#64748b">This link expires in ${config.auth.passwordResetTtlMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`
    ),
  });
}

export default { sendVerificationEmail, sendPasswordResetEmail };
