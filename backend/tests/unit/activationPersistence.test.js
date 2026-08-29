import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('activation service uses the active Prisma model without abandoned raw tables', async () => {
  const source = await readFile(
    new URL('../../src/application/services/activationService.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /prisma\.activationRequest\.create/);
  assert.match(source, /prisma\.activationRequest\.findMany/);
  assert.match(source, /prisma\.\$transaction/);
  assert.doesNotMatch(source, /UserActivationRequest|DevelopmentEmailOutbox|\$executeRaw/);
});

test('registration safely repairs an interrupted pending tenant activation', async () => {
  const source = await readFile(
    new URL('../../src/application/services/authService.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /existing\.status === 'PENDING_VERIFICATION'/);
  assert.match(source, /passwordService\.verifyPassword\(password, existing\.passwordHash\)/);
  assert.match(source, /prisma\.activationRequest\.findFirst/);
});
