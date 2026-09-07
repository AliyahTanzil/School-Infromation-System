import { afterEach, expect, it, vi } from 'vitest';
import api, { me } from './auth.js';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('unwraps the current user from the auth response envelope', async () => {
  const user = { id: 'admin', accountType: 'TENANT_ADMIN', roles: ['SCHOOL_ADMIN'] };
  api.defaults.adapter = vi.fn(async (config) => ({
    data: { success: true, data: { user } },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }));

  await expect(me()).resolves.toEqual(user);
});
