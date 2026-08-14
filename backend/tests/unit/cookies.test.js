import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { setRefreshCookie } from '../../src/shared/utils/cookies.js';

test('sets a secure cross-site refresh cookie in production', async () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

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
  assert.match(cookie, /SameSite=None/);
  assert.match(cookie, /Path=\/api\/auth/);

  if (previousEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnv;
});
