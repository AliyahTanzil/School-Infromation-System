import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LiveLearningWorkspace from './LiveLearningWorkspace.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});

it('waits for school recovery and ignores a cached school identity', async () => {
  sessionStorage.setItem('sais.schoolId', 'foreign-school');
  api.get.mockRejectedValueOnce(new Error('School unavailable'));
  render(<LiveLearningWorkspace />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(await screen.findByText('School unavailable')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  api.get.mockImplementation(async (path) => ({
    data: { data: path === '/school' ? { school: { id: 'school-1' } } : [] },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByText('No live sessions found for your accessible classrooms.')
  ).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/lms/live-sessions', { signal: expect.any(AbortSignal) });
  expect(api.get).toHaveBeenCalledWith('/lms/live-sessions/recordings', {
    signal: expect.any(AbortSignal),
  });
  expect(sessionStorage.getItem('sais.schoolId')).toBe('foreign-school');
});

it('does not load live learning before school setup exists', async () => {
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  render(<LiveLearningWorkspace />);
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});

it.each(['/lms/live-sessions', '/lms/live-sessions/recordings'])(
  'reports a failed %s read and recovers without silently showing empty results',
  async (failedPath) => {
    let failed = true;
    api.get.mockImplementation(async (path) => {
      if (path === '/school') return { data: { data: { school: { id: 'school-1' } } } };
      if (failed && path === failedPath) throw new Error('Learning unavailable');
      return {
        data: {
          data:
            path === '/lms/live-sessions'
              ? [{ id: 'session-1', title: 'Science lesson', status: 'LIVE' }]
              : [],
        },
      };
    });
    render(<LiveLearningWorkspace />);
    expect(await screen.findByText('Learning unavailable')).toBeInTheDocument();
    expect(
      screen.queryByText('No live sessions found for your accessible classrooms.')
    ).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Science lesson' })).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(5));
  }
);
