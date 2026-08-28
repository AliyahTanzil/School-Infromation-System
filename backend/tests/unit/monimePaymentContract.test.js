import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
test('Monime checkout uses current hosted checkout headers and payment options', async () => {
  const source = await read('../../src/application/gateways/monimePaymentGateway.js');
  assert.match(source, /Monime-Space-Id/);
  assert.match(source, /\/v1\/checkout-sessions/);
  assert.match(source, /card: \{ disable: false \}/);
  assert.match(source, /bank: \{ disable: true \}/);
  assert.match(source, /momo: \{ disable: false/);
});
test('payment intent ownership comes from authenticated context and invoice', async () => {
  const service = await read('../../src/application/services/paymentGatewayService.js');
  const validators = await read('../../src/application/validators/paymentGatewayValidators.js');
  assert.match(service, /invoice\.studentId/);
  assert.doesNotMatch(validators, /tenantId|schoolId|studentId|providerId/);
});
test('Monime persistence migration is non-destructive', async () => {
  const sql = await read('../../prisma/migrations/20260827250000_monime_payments/migration.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "PaymentIntent"/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});
test('successful verified events reconcile payment, invoice, and ledger atomically', async () => {
  const service = await read('../../src/application/services/paymentGatewayService.js');
  assert.match(service, /prisma\.\$transaction\(async \(tx\)/);
  assert.match(service, /tx\.payment\.create/);
  assert.match(service, /tx\.invoice\.update/);
  assert.match(service, /tx\.financialTransaction\.create/);
});
