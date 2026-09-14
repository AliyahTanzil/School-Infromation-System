import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import transactionDiagnostic from '../../src/shared/errors/transactionDiagnostic.js';

test('transaction diagnostics emit fixed categories without private database details', () => {
  const cases = [
    ['Unable to start a transaction in the given time.', 'start_timeout'],
    [
      'Transaction already closed: A query cannot be executed on an expired transaction.',
      'execution_timeout',
    ],
    ['Transaction timed out', 'execution_timeout'],
    ['Connection was closed', 'connection_closed'],
    ['Transaction already closed', 'transaction_closed'],
    ['Unrecognized failure', 'unknown'],
  ];
  for (const [message, category] of cases) {
    for (const inMetadata of [false, true]) {
      const error = new Prisma.PrismaClientKnownRequestError(
        inMetadata ? 'private query and credentials' : `${message} private query and credentials`,
        {
          code: 'P2028',
          clientVersion: 'test',
          meta: {
            error: inMetadata ? `${message} private query and credentials` : { secret: true },
          },
        }
      );
      assert.deepEqual(transactionDiagnostic(error), { transactionFailure: category });
    }
  }
});

test('transaction diagnostics ignore unrelated and forged errors', () => {
  for (const error of [
    null,
    undefined,
    new Error('Transaction already closed'),
    { code: 'P2028', message: 'Transaction already closed' },
    new Prisma.PrismaClientKnownRequestError('Transaction already closed', {
      code: 'P2002',
      clientVersion: 'test',
    }),
  ]) {
    assert.deepEqual(transactionDiagnostic(error), {});
  }
});
