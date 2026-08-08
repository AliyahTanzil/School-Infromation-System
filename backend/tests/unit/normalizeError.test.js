import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import AuthenticationError from '../../src/shared/errors/AuthenticationError.js';
import ValidationError from '../../src/shared/errors/ValidationError.js';
import normalizeError from '../../src/shared/errors/normalizeError.js';

describe('normalizeError', () => {
  it('preserves typed application errors', () => {
    const error = new AuthenticationError('Invalid credentials');

    assert.equal(normalizeError(error), error);
  });

  it('converts Zod errors into the API validation error contract', () => {
    const result = z.object({ email: z.string().email() }).safeParse({ email: 'not-an-email' });
    const normalized = normalizeError(result.error);

    assert.ok(normalized instanceof ValidationError);
    assert.equal(normalized.statusCode, 400);
    assert.ok(normalized.details.some((issue) => issue.path === 'email'));
  });
});
