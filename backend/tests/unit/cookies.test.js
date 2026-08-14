import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { setRefreshCookie } from '../../src/shared/utils/cookies.js';

test('sets a secure same-site refresh cookie in production', async () => {
  const previousEnv = globalThis.process.env.NODE_ENV;
  globalThis.process.env.NODE_ENV = 'production';

  const app = express();
  app.use(cookieParser());
  app.get('/set-cookie', (req, res) => {
    setRefreshCookie(res, 'refresh-token');
    res.status(204).end();
  });

  const response = await request(app).get('/set-cookie');
  const cookie = response.headers['set-cookie']?.[0] ?? '';
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api\/auth/);

  if (previousEnv === undefined) delete globalThis.process.env.NODE_ENV;
  else globalThis.process.env.NODE_ENV = previousEnv;
});
