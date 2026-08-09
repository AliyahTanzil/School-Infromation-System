import bcrypt from 'bcryptjs';
import config from '../../config/index.js';
import ValidationError from '../../shared/errors/ValidationError.js';

/**
 * PasswordService
 *
 * Owns everything about password material: strength policy enforcement,
 * hashing, and verification. bcrypt is used with a configurable cost factor
 * (default 12) which auto-generates and embeds a per-hash salt.
 */

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * Validate a plaintext password against the strength policy.
 * Throws ValidationError with field-level details on failure.
 * @param {string} password
 */
export function assertPasswordStrength(password) {
  const failures = [];

  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    failures.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }
  if (typeof password === 'string' && password.length > MAX_LENGTH) {
    failures.push(`Password must be at most ${MAX_LENGTH} characters long`);
  }
  if (!/[a-z]/.test(password)) {
    failures.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    failures.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    failures.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    failures.push('Password must contain at least one special character');
  }

  if (failures.length > 0) {
    throw new ValidationError('Password does not meet complexity requirements', {
      field: 'password',
      failures,
    });
  }
}

/**
 * Hash a plaintext password. Validates strength first.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(password) {
  assertPasswordStrength(password);
  const salt = await bcrypt.genSalt(config.auth.bcryptRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a stored hash.
 * Never throws on mismatch — returns a boolean.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string' || hash.length === 0) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export default { assertPasswordStrength, hashPassword, verifyPassword };
