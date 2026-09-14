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

it('includes work from every returned classroom and orders the combined calendar', async () => {
  api.get.mockImplementation(async (path, options) => {
    if (path === '/lms/classrooms')
      return {
        data: {
          data: [
            { id: 'class-1', name: 'Science' },
            { id: 'class-2', name: 'English' },
          ],
        },
      };
    if (path === '/lms/assignments')
      return {
        data: {
          data: [
            { id: options.params.classroomId, title: `${options.params.classroomId} homework` },
          ],
        },
      };
    if (path === '/lms/calendar')
      return {
        data: {
          data: [
            {
              id: options.params.classroomId,
              title: `${options.params.classroomId} lesson`,
              startsAt:
                options.params.classroomId === 'class-1'
                  ? '2026-09-16T10:00:00Z'
                  : '2026-09-15T10:00:00Z',
            },
          ],
        },
      };
    return result(path);
  });
  render(<StudentHomeDashboard />);
  expect(await screen.findByText('class-2 homework')).toBeInTheDocument();
  expect(screen.getByText('class-1 homework')).toBeInTheDocument();
  const lessons = screen.getAllByText(/class-[12] lesson/);
  expect(lessons.map((element) => element.textContent)).toEqual([
    'class-2 lesson',
    'class-1 lesson',
  ]);
  const calendarCalls = api.get.mock.calls.filter(([path]) => path === '/lms/calendar');
  expect(calendarCalls[0][1].params.start).toBe(calendarCalls[1][1].params.start);
  expect(calendarCalls[0][1].params.end).toBe(calendarCalls[1][1].params.end);
});

it('does not present a partial aggregate when a later classroom fails', async () => {
  api.get.mockImplementation(async (path, options) => {
    if (path === '/lms/classrooms')
      return {
        data: {
          data: [
            { id: 'class-1', name: 'Science' },
            { id: 'class-2', name: 'English' },
          ],
        },
      };
    if (path === '/lms/assignments') {
      if (options.params.classroomId === 'class-2') throw new Error('Second classroom unavailable');
      return { data: { data: [{ id: 'first', title: 'Partial homework' }] } };
    }
    return result(path);
  });
  render(<StudentHomeDashboard />);
  expect(await screen.findByText('Second classroom unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Partial homework')).not.toBeInTheDocument();
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
