import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import StudentHomeDashboard from './StudentHomeDashboard.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));
vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { firstName: 'Learner' } }),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});
const result = (path) => ({
  data: {
    data:
      path === '/school'
        ? { school: { id: 'school-1' } }
        : path === '/lms/classrooms'
          ? [{ id: 'class-1', name: 'Science' }]
          : [],
  },
});

it('waits for authenticated school recovery instead of trusting a previous session', async () => {
  sessionStorage.setItem('sais.schoolId', 'foreign-school');
  api.get.mockRejectedValueOnce(new Error('School unavailable'));
  render(<StudentHomeDashboard />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(await screen.findByText('School unavailable')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  api.get.mockImplementation(async (path) => result(path));
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith('/lms/assignments', {
      signal: expect.any(AbortSignal),
      params: { classroomId: 'class-1', status: 'PUBLISHED' },
    })
  );
  for (const [, options] of api.get.mock.calls) expect(options?.headers).toBeUndefined();
  expect(sessionStorage.getItem('sais.schoolId')).toBe('foreign-school');
});

it('keeps learning requests blocked until school setup exists', async () => {
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  render(<StudentHomeDashboard />);
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});

it.each(['/lms/classrooms', '/communication/unread-count', '/lms/assignments', '/lms/calendar'])(
  'reports and retries failed %s requests',
  async (failedPath) => {
    let fail = true;
    api.get.mockImplementation(async (path) => {
      if (fail && path === failedPath) throw new Error('Learning unavailable');
      return result(path);
    });
    render(<StudentHomeDashboard />);
    expect(await screen.findByText('Learning unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No published assignments found.')).not.toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No published assignments found.')).toBeInTheDocument();
    expect(screen.queryByText('Learning unavailable')).not.toBeInTheDocument();
  }
);
