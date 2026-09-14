import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import api from '../api/auth.js';
import { useSchoolContext } from './useSchoolContext.js';

vi.mock('../api/auth.js', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('loads the canonical school API and its direct response envelope', async () => {
  api.get.mockImplementation(async (path) => {
    if (path !== '/school') throw new Error('Route not found');
    return { data: { success: true, data: { id: 'main', name: 'Main School' } } };
  });
  const { result } = renderHook(() => useSchoolContext());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.schoolId).toBe('main');
  expect(result.current.schoolName).toBe('Main School');
  expect(result.current.error).toBe('');
  expect(api.get).toHaveBeenCalledWith('/school', { signal: expect.any(AbortSignal) });
});
