import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import AuthenticationError from '../../src/shared/errors/AuthenticationError.js';
import ValidationError from '../../src/shared/errors/ValidationError.js';
import normalizeError from '../../src/shared/errors/normalizeError.js';

it('maps closed PostgreSQL connections to a retryable service error', () => {
  const error = normalizeError(new Error('Error in PostgreSQL connection: Error { kind: Closed }'));
  assert.equal(error.statusCode, 503);
  assert.equal(error.code, 'DATABASE_UNAVAILABLE');
});

describe('normalizeError', () => {
  it('does not trust unknown or mismatched parser error properties', () => {
    for (const properties of [
      { type: 'entity.parse.failed', status: 503 },
      { type: 'unknown.parser.failure', status: 400 },
    ]) {
      const normalized = normalizeError(Object.assign(new Error('Parser failure'), properties));
      assert.equal(normalized.statusCode, 500);
      assert.equal(normalized.code, 'INTERNAL_ERROR');
      assert.equal(normalized.details, null);
    }
    assert.equal(
      normalizeError({ type: 'entity.parse.failed', status: 400 }).code,
      'INTERNAL_ERROR'
    );
  });

  it('redacts unexpected production errors and retains development diagnostics', (t) => {
    const originalEnvironment = process.env.NODE_ENV;
    t.after(() => {
      if (originalEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnvironment;
    });
    const internal = new Error('Connection failed for postgresql://private-host/private-db');

    process.env.NODE_ENV = 'production';
    const production = normalizeError(internal);
    assert.equal(production.message, 'An unexpected error occurred. Please try again.');
    assert.equal(production.statusCode, 500);
    assert.equal(production.code, 'INTERNAL_ERROR');
    assert.equal(production.details, null);
    assert.equal(production.isOperational, false);

    process.env.NODE_ENV = 'development';
    assert.equal(normalizeError(internal).message, internal.message);
  });

  for (const [code, statusCode, expectedCode] of [
    ['P2002', 409, 'DB_UNIQUE_CONSTRAINT'],
    ['P2025', 404, 'NOT_FOUND'],
    ['P2003', 500, 'DB_P2003'],
    ['P2028', 503, 'DB_P2028'],
  ]) {
    it(`maps ${code} without exposing database text or metadata`, () => {
      const normalized = normalizeError(
        new Prisma.PrismaClientKnownRequestError('private database query', {
          code,
          clientVersion: '6.19.0',
          meta: { target: ['private_column'], detail: 'private database metadata' },
        })
      );
      assert.equal(normalized.statusCode, statusCode);
      assert.equal(normalized.code, expectedCode);
      assert.ok(normalized.details == null);
      assert.doesNotMatch(normalized.message, /private/);
    });
  }

  for (const error of [
    new Prisma.PrismaClientValidationError('private validation query', { clientVersion: '6.19.0' }),
    new Prisma.PrismaClientInitializationError('private connection string', '6.19.0'),
    new Prisma.PrismaClientRustPanicError('private engine diagnostics', '6.19.0'),
  ]) {
    it(`redacts ${error.name} and returns a service-unavailable response`, () => {
      const normalized = normalizeError(error);
      assert.equal(normalized.statusCode, 503);
      assert.equal(normalized.code, 'DATABASE_UNAVAILABLE');
      assert.equal(normalized.details, null);
      assert.equal(
        normalized.message,
        'The service is temporarily unavailable. Please try again shortly.'
      );
    });
  }

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
