import { expect, it } from 'vitest';
import { getApiErrorMessage } from './errorMessage.js';

it('shows the failing fields for request validation errors', () => {
  expect(
    getApiErrorMessage({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [{ path: 'profile.email', message: 'Invalid email' }],
          },
        },
      },
    })
  ).toBe('Request validation failed: profile.email: Invalid email');
});

it('keeps non-validation errors concise', () => {
  expect(
    getApiErrorMessage({
      response: {
        data: {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
            details: [{ message: 'Internal details' }],
          },
        },
      },
    })
  ).toBe('Access denied');
});
