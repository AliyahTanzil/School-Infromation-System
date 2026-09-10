import { afterEach, expect, it, vi } from 'vitest';
import api, { me } from './auth.js';
import { subscribeSetupChanges } from '../setupProgressEvents.js';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('notifies setup guidance only after successful setup mutations', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeSetupChanges(listener);
  api.defaults.adapter = async (config) => ({
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
  try {
    await api.get('/schools');
    await api.post('/auth/login');
    expect(listener).not.toHaveBeenCalled();
    await api.post('/schools', { name: 'School' });
    await api.patch('/classes/class-1', { name: 'Year 1' });
    await api.delete('/subjects/subject-1');
    expect(listener).toHaveBeenCalledTimes(3);
    api.defaults.adapter = async () => {
      throw new Error('Save failed');
    };
    await expect(api.post('/schools')).rejects.toThrow('Save failed');
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    api.defaults.adapter = async (config) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
    await api.post('/students');
    expect(listener).toHaveBeenCalledTimes(3);
  } finally {
    unsubscribe();
  }
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
