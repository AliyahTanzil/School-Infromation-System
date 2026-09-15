import { afterEach, expect, it, vi } from 'vitest';
import api, {
  login,
  register,
  logout,
  me,
  refresh,
  resetPassword,
  setAccessToken,
} from './auth.js';
import { subscribeSetupChanges } from '../setupProgressEvents.js';

const originalAdapter = api.defaults.adapter;

it('clears in-memory credentials only after a successful password reset', async () => {
  setAccessToken('old-session');
  let fail = true;
  const requests = [];
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/reset-password' && fail) throw new Error('Expired link');
    requests.push(config);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  await expect(
    resetPassword({ token: 'expired', password: 'StrongPassword!42' })
  ).rejects.toThrow();
  await api.get('/subjects');
  expect(requests.at(-1).headers.get('Authorization')).toBe('Bearer old-session');
  fail = false;
  await resetPassword({ token: 'valid', password: 'StrongPassword!42' });
  await api.get('/subjects');
  expect(requests.at(-1).headers.get('Authorization')).toBeUndefined();
});

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

it.each([
  ['login', login],
  ['register', register],
])(
  'does not restore credentials when delayed %s completes after logout',
  async (route, authenticate) => {
    let complete;
    let latestRequest;
    api.defaults.adapter = async (config) => {
      latestRequest = config;
      const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      if (config.url === `/auth/${route}`)
        return new Promise((resolve) => {
          complete = () =>
            resolve({
              ...response,
              data: { data: { accessToken: 'late-token', user: { id: 'old-user' } } },
            });
        });
      return response;
    };
    const pending = authenticate({});
    const rejected = expect(pending).rejects.toThrow('Authentication session changed');
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
    await logout();
    complete();
    await rejected;
    await api.get('/subjects');
    expect(latestRequest.headers.get('Authorization')).toBeUndefined();
  }
);

it.each([
  ['login', login],
  ['register', register],
])('preserves newer credentials when delayed %s completes', async (route, authenticate) => {
  let complete;
  let latestRequest;
  api.defaults.adapter = async (config) => {
    latestRequest = config;
    const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    if (config.url === `/auth/${route}`)
      return new Promise((resolve) => {
        complete = () => resolve({ ...response, data: { data: { accessToken: 'late-token' } } });
      });
    return response;
  };
  const pending = authenticate({});
  const rejected = expect(pending).rejects.toThrow('Authentication session changed');
  await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
  setAccessToken('new-session');
  complete();
  await rejected;
  await api.get('/subjects');
  expect(latestRequest.headers.get('Authorization')).toBe('Bearer new-session');
});

it.each([
  ['login', login],
  ['register', register],
])('accepts an uninterrupted %s response', async (_route, authenticate) => {
  const result = { accessToken: 'accepted-token', user: { id: 'user-1' } };
  let latestRequest;
  api.defaults.adapter = async (config) => {
    latestRequest = config;
    return { data: { data: result }, status: 200, statusText: 'OK', headers: {}, config };
  };
  await expect(authenticate({})).resolves.toEqual(result);
  await api.get('/subjects');
  expect(latestRequest.headers.get('Authorization')).toBe('Bearer accepted-token');
});

it.each([false, true])(
  'preserves a newer token after delayed logout (failure: %s)',
  async (fail) => {
    setAccessToken('old-session');
    let complete;
    let latestRequest;
    api.defaults.adapter = async (config) => {
      latestRequest = config;
      const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      if (config.url === '/auth/logout')
        return new Promise((resolve, reject) => {
          complete = () => (fail ? reject(new Error('Logout failed')) : resolve(response));
        });
      return response;
    };
    const pending = logout();
    const settled = pending.catch((error) => error);
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
    setAccessToken('new-session');
    complete();
    const outcome = await settled;
    if (fail) expect(outcome.message).toBe('Logout failed');
    else expect(outcome).toBeUndefined();
    await api.get('/subjects');
    expect(latestRequest.headers.get('Authorization')).toBe('Bearer new-session');
  }
);

it.each([false, true])(
  'preserves a newer login after delayed password reset (failure: %s)',
  async (fail) => {
    setAccessToken('old-session');
    let complete;
    let latestRequest;
    api.defaults.adapter = async (config) => {
      latestRequest = config;
      const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      if (config.url === '/auth/reset-password')
        return new Promise((resolve, reject) => {
          complete = () => (fail ? reject(new Error('Reset failed')) : resolve(response));
        });
      if (config.url === '/auth/login')
        return { ...response, data: { data: { accessToken: 'new-session' } } };
      return response;
    };
    const pending = resetPassword({ token: 'reset-token', password: 'StrongPassword!42' });
    const settled = pending.catch((error) => error);
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
    await login({});
    complete();
    const outcome = await settled;
    if (fail) expect(outcome.message).toBe('Reset failed');
    else expect(outcome.status).toBe(200);
    await api.get('/subjects');
    expect(latestRequest.headers.get('Authorization')).toBe('Bearer new-session');
  }
);

it.each(['get', 'post'])(
  'does not refresh or replay a stale %s after session replacement',
  async (method) => {
    setAccessToken('old-session');
    let rejectOld;
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === '/protected')
        return new Promise((_resolve, reject) => {
          rejectOld = () =>
            reject(
              Object.assign(new Error('Old session expired'), { config, response: { status: 401 } })
            );
        });
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };
    const pending = api[method]('/protected');
    const rejected = expect(pending).rejects.toThrow('Old session expired');
    await vi.waitFor(() => expect(rejectOld).toBeTypeOf('function'));
    setAccessToken('new-session');
    rejectOld();
    await rejected;
    expect(requests.map((request) => request.url)).toEqual(['/protected']);
    await api.get('/subjects');
    expect(requests.at(-1).headers.get('Authorization')).toBe('Bearer new-session');
  }
);

it.each([false, true])(
  'refreshes a current unauthorized request and retries only once (retry fails: %s)',
  async (failRetry) => {
    setAccessToken('expired-session');
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      if (config.url === '/auth/refresh')
        return { ...response, data: { data: { accessToken: 'rotated-session' } } };
      if (!config._authRetry || failRetry)
        throw Object.assign(new Error('Expired'), { config, response: { status: 401 } });
      return response;
    };
    const pending = api.get('/protected');
    if (failRetry) await expect(pending).rejects.toThrow('Expired');
    else await expect(pending).resolves.toMatchObject({ status: 200 });
    expect(requests.map((request) => request.url)).toEqual([
      '/protected',
      '/auth/refresh',
      '/protected',
    ]);
    expect(requests.at(-1).headers.get('Authorization')).toBe('Bearer rotated-session');
  }
);
