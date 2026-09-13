import { afterEach, expect, it, vi } from 'vitest';
import api, { logout, me, refresh, setAccessToken } from './auth.js';
import { subscribeSetupChanges } from '../setupProgressEvents.js';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setAccessToken(null);
});

it('clears the access token even when server logout fails', async () => {
  setAccessToken('old-session');
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url === '/auth/logout') throw new Error('Network unavailable');
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  await expect(logout()).rejects.toThrow('Network unavailable');
  await api.get('/subjects');
  expect(requests[0].headers.get('Authorization')).toBe('Bearer old-session');
  expect(requests[1].headers.get('Authorization')).toBeUndefined();
});

it('shares concurrent refresh requests and uses the rotated access token', async () => {
  setAccessToken('old-session');
  api.defaults.adapter = vi.fn(async (config) => ({
    data: { data: { accessToken: 'rotated-session' } },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }));
  const first = refresh();
  const second = refresh();
  expect(first).toBe(second);
  await Promise.all([first, second]);
  expect(api.defaults.adapter).toHaveBeenCalledTimes(1);
  await api.get('/subjects');
  expect(api.defaults.adapter.mock.calls[1][0].headers.get('Authorization')).toBe(
    'Bearer rotated-session'
  );
});

it('does not restore a logged-out session when an earlier refresh completes', async () => {
  setAccessToken('old-session');
  let completeRefresh;
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    if (config.url === '/auth/refresh') {
      return new Promise((resolve) => {
        completeRefresh = () =>
          resolve({ ...response, data: { data: { accessToken: 'late-token' } } });
      });
    }
    return response;
  };
  const pending = refresh();
  const rejected = expect(pending).rejects.toThrow('Authentication session changed');
  await vi.waitFor(() => expect(completeRefresh).toBeTypeOf('function'));
  await logout();
  completeRefresh();
  await rejected;
  await api.get('/subjects');
  expect(requests.at(-1).headers.get('Authorization')).toBeUndefined();
});

it('does not clear a newer session when an older request fails to refresh', async () => {
  setAccessToken('old-session');
  let failRefresh;
  let latestRequest;
  api.defaults.adapter = async (config) => {
    latestRequest = config;
    if (config.url === '/protected') {
      throw Object.assign(new Error('Expired'), { config, response: { status: 401 } });
    }
    if (config.url === '/auth/refresh') {
      return new Promise((resolve, reject) => {
        failRefresh = reject;
      });
    }
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  const pending = api.get('/protected');
  const rejected = expect(pending).rejects.toThrow('Expired');
  await vi.waitFor(() => expect(failRefresh).toBeTypeOf('function'));
  setAccessToken('new-session');
  failRefresh(new Error('Refresh failed'));
  await rejected;
  await api.get('/subjects');
  expect(latestRequest.headers.get('Authorization')).toBe('Bearer new-session');
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
