import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import { AppError } from '../../src/foundation/errors.js';
import { errorHandler, requestId } from '../../src/foundation/middleware.js';
// @ts-expect-error Legacy application errors remain supported during migration.
import ValidationError from '../../src/shared/errors/ValidationError.js';

test('active HTTP error handler normalizes untrusted errors and preserves typed contracts', async (t) => {
  const originalEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => {
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  });

  const cases = [
    {
      name: 'decorated runtime error',
      error: Object.assign(new Error('private connection string'), {
        statusCode: 503,
        code: 'DRIVER_FAILURE',
        details: { query: 'private query' },
      }),
      status: 500,
      code: 'INTERNAL_ERROR',
    },
    {
      name: 'plain object with invalid HTTP status',
      error: { statusCode: 9999, code: 'DRIVER_FAILURE', message: 'private credentials' },
      status: 500,
      code: 'INTERNAL_ERROR',
    },
    { name: 'null', error: null, status: 500, code: 'INTERNAL_ERROR' },
    { name: 'undefined', error: undefined, status: 500, code: 'INTERNAL_ERROR' },
    {
      name: 'foundation application error',
      error: new AppError('Access denied', 403, 'FORBIDDEN'),
      status: 403,
      code: 'FORBIDDEN',
    },
    {
      name: 'legacy application error',
      error: new ValidationError('Request validation failed', [{ path: 'email' }]),
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  ];

  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const app = express();
      app.use(requestId);
      // Invoke directly so null/undefined reach the error boundary, rather than
      // Express interpreting next(null) as a successful middleware continuation.
      app.get('/failure', (req, res, next) => errorHandler(entry.error, req, res, next));
      const response = await request(app).get('/failure').set('x-request-id', 'error-safety-test');
      assert.equal(response.status, entry.status);
      assert.equal(response.body.success, false);
      assert.equal(response.body.error.code, entry.code);
      assert.equal(response.body.requestId, 'error-safety-test');
      assert.equal(response.body.stack, undefined);
      assert.doesNotMatch(JSON.stringify(response.body), /private/);
      if (entry.code === 'INTERNAL_ERROR') {
        assert.equal(
          response.body.error.message,
          'An unexpected error occurred. Please try again.'
        );
        assert.equal(response.body.error.details, null);
      }
      if (entry.code === 'VALIDATION_ERROR') {
        assert.deepEqual(response.body.error.details, [{ path: 'email' }]);
      }
    });
  }
});
