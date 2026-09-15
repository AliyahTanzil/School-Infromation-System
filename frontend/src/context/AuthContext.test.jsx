import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import * as api from '../api/auth.js';
vi.mock('../api/auth.js', () => ({
  refresh: vi.fn(),
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const show = () => renderHook(() => useAuth(), { wrapper: AuthProvider });
it('restores an uninterrupted startup session', async () => {
  api.refresh.mockResolvedValue({});
  api.me.mockResolvedValue({ id: 'restored-user' });
  const { result } = show();
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toEqual({ id: 'restored-user' });
});
it.each(['login', 'register', 'logout', 'resetPassword'])(
  'ignores an old identity response after %s',
  async (action) => {
    const identity = deferred();
    api.refresh.mockResolvedValue({});
    api.me.mockReturnValue(identity.promise);
    api[action].mockResolvedValue({ user: { id: 'new-user' } });
    const { result } = show();
    await waitFor(() => expect(api.me).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current[action]({});
    });
    await act(async () => {
      identity.resolve({ id: 'old-user' });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(
      ['login', 'register'].includes(action) ? { id: 'new-user' } : null
    );
  }
);
it('does not clear a new login when startup identity lookup fails', async () => {
  const identity = deferred();
  api.refresh.mockResolvedValue({});
  api.me.mockReturnValue(identity.promise);
  api.login.mockResolvedValue({ user: { id: 'new-user' } });
  const { result } = show();
  await waitFor(() => expect(api.me).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.login({});
  });
  await act(async () => {
    identity.reject(new Error('Expired session'));
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toEqual({ id: 'new-user' });
});
it('skips startup identity lookup when logout happens during refresh', async () => {
  const pending = deferred();
  api.refresh.mockReturnValue(pending.promise);
  api.logout.mockResolvedValue({});
  const { result } = show();
  await act(async () => {
    await result.current.logout();
  });
  await act(async () => {
    pending.resolve({});
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(api.me).not.toHaveBeenCalled();
  expect(result.current.user).toBeNull();
});
it('does not request identity after provider unmount', async () => {
  const pending = deferred();
  api.refresh.mockReturnValue(pending.promise);
  const { unmount } = show();
  unmount();
  await act(async () => {
    pending.resolve({});
  });
  expect(api.me).not.toHaveBeenCalled();
});

it.each([false, true])('preserves a new login after delayed logout (failure: %s)', async (fail) => {
  const pending = deferred();
  api.refresh.mockResolvedValue({});
  api.me.mockResolvedValue({ id: 'old-user' });
  api.logout.mockReturnValue(pending.promise);
  api.login.mockResolvedValue({ user: { id: 'new-user' } });
  const { result } = show();
  await waitFor(() => expect(result.current.loading).toBe(false));
  let settled;
  act(() => {
    settled = result.current.logout().catch((error) => error);
  });
  await act(async () => {
    await result.current.login({});
  });
  await act(async () => {
    if (fail) pending.reject(new Error('Logout failed'));
    else pending.resolve({});
    await settled;
  });
  expect(result.current.user).toEqual({ id: 'new-user' });
});
it('clears the current user even if server logout fails', async () => {
  api.refresh.mockResolvedValue({});
  api.me.mockResolvedValue({ id: 'old-user' });
  api.logout.mockRejectedValue(new Error('Logout failed'));
  const { result } = show();
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await expect(result.current.logout()).rejects.toThrow('Logout failed');
  });
  expect(result.current.user).toBeNull();
});
