import { afterEach, expect, it, vi } from 'vitest';
import api, { refresh, setAccessToken } from './auth.js';

afterEach(() => {
  vi.restoreAllMocks();
  setAccessToken(null);
});

it('shares simultaneous refresh requests and permits later token rotation', async () => {
  let complete;
  const post = vi.spyOn(api, 'post').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const first = refresh();
  const second = refresh();
  expect(post).toHaveBeenCalledTimes(1);
  expect(first).toBe(second);
  complete({ data: { data: { accessToken: 'test-token' } } });
  expect(await second).toEqual({ accessToken: 'test-token' });
  post.mockResolvedValueOnce({ data: { data: { accessToken: 'rotated-token' } } });
  await refresh();
  expect(post).toHaveBeenCalledTimes(2);
});

it('preserves an unauthenticated error and allows a later retry', async () => {
  const failure = { response: { status: 401 } };
  const post = vi.spyOn(api, 'post').mockRejectedValue(failure);
  await expect(refresh()).rejects.toBe(failure);
  await expect(refresh()).rejects.toBe(failure);
  expect(post).toHaveBeenCalledTimes(2);
});
