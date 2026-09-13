import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/foundation/app.js';
import { config } from '../../src/foundation/config.js';

test('active API returns safe client errors for rejected request bodies', async (t) => {
  const previousLimit = config.jsonBodyLimit;
  config.jsonBodyLimit = '1kb';
  t.after(() => {
    config.jsonBodyLimit = previousLimit;
  });
  const app = createApp();
  const cases = [
    {
      name: 'malformed JSON',
      body: '{"private-secret":',
      status: 400,
      code: 'INVALID_REQUEST_BODY',
    },
    {
      name: 'oversized JSON',
      body: JSON.stringify({ value: 'private-secret'.repeat(200) }),
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    },
    {
      name: 'unsupported charset',
      body: '{"private-secret":true}',
      contentType: 'application/json; charset=unsupported',
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
    },
    {
      name: 'unsupported content encoding',
      body: '{"private-secret":true}',
      encoding: 'unsupported',
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
    },
  ];
  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const pending = request(app)
        .post('/api/auth/login')
        .set('Content-Type', entry.contentType ?? 'application/json')
        .set('x-request-id', 'body-error-test');
      if (entry.encoding) pending.set('Content-Encoding', entry.encoding);
      const response = await pending.send(entry.body);
      assert.equal(response.status, entry.status);
      assert.equal(response.body.success, false);
      assert.equal(response.body.error.code, entry.code);
      assert.equal(response.body.error.details, null);
      assert.equal(response.body.requestId, 'body-error-test');
      assert.equal(response.headers['x-request-id'], 'body-error-test');
      assert.doesNotMatch(JSON.stringify(response.body), /private-secret/);
      assert.equal(response.body.stack, undefined);
    });
  }
});
