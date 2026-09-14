import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import StudentSubmissionCenter from './StudentSubmissionCenter.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});

it('waits for school recovery instead of using a cached school and saves without a school override', async () => {
  sessionStorage.setItem('sais.schoolId', 'previous-school');
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  api.get.mockRejectedValueOnce(new Error('Unavailable'));
  render(<StudentSubmissionCenter />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(await screen.findByText('Unable to load')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('School ID')).not.toBeInTheDocument();

  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/school'
          ? { school: { id: 'current-school' } }
          : path === '/lms/classrooms'
            ? [{ id: 'classroom-1', name: 'Science' }]
            : path === '/lms/assignments'
              ? [{ id: 'assignment-1', title: 'Essay', points: 10 }]
              : [],
    },
  }));
  api.post.mockResolvedValue({ data: {} });
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  fireEvent.click(await screen.findByRole('button', { name: /Essay/ }));
  fireEvent.change(screen.getByLabelText('Assignment response'), {
    target: { value: 'My response' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith('/lms/submissions', {
      assignmentId: 'assignment-1',
      body: 'My response',
      attachments: [],
      status: 'DRAFT',
    })
  );
  expect(api.get).toHaveBeenCalledWith('/lms/assignments', {
    signal: expect.any(AbortSignal),
    params: { classroomId: 'classroom-1', status: 'PUBLISHED' },
  });
  expect(api.get).toHaveBeenCalledWith('/lms/submissions', { signal: expect.any(AbortSignal) });
  expect(sessionStorage.getItem('sais.schoolId')).toBe('previous-school');
});

it('does not load school work when school setup is missing', async () => {
  sessionStorage.setItem('sais.schoolId', 'previous-school');
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  render(<StudentSubmissionCenter />);
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Classroom ID')).not.toBeInTheDocument();
});

it('retracts submitted work using the authenticated context', async () => {
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/school'
          ? { school: { id: 'school-1' } }
          : path === '/lms/classrooms'
            ? [{ id: 'classroom-1', name: 'Science' }]
            : path === '/lms/assignments'
              ? [{ id: 'assignment-1', title: 'Essay', points: 10 }]
              : [{ id: 'submission-1', assignmentId: 'assignment-1', status: 'SUBMITTED' }],
    },
  }));
  api.patch.mockResolvedValue({ data: {} });
  render(<StudentSubmissionCenter />);
  fireEvent.click(await screen.findByRole('button', { name: /Essay/ }));
  fireEvent.click(screen.getByRole('button', { name: /Retract submission/ }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith('/lms/submissions/submission-1/status', {
      status: 'DRAFT',
    })
  );
});

it('recovers classroom loading and ignores a classroom cached by another session', async () => {
  sessionStorage.setItem('sais.classroomId', 'foreign-classroom');
  let unavailable = true;
  api.get.mockImplementation(async (path) => {
    if (path === '/school') return { data: { data: { school: { id: 'school-1' } } } };
    if (path === '/lms/classrooms' && unavailable) throw new Error('Classrooms unavailable');
    return { data: { data: [] } };
  });
  render(<StudentSubmissionCenter />);
  expect(await screen.findByText('Classrooms unavailable')).toBeInTheDocument();
  expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/school', '/lms/classrooms']);
  unavailable = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No accessible classrooms')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Classroom' })).toBeDisabled();
  expect(screen.queryByPlaceholderText('Classroom UUID')).not.toBeInTheDocument();
});

it('ignores late assignment responses after switching accessible classrooms', async () => {
  let resolveFirst;
  let firstSignal;
  api.get.mockImplementation((path, options) => {
    let data = [];
    if (path === '/school') data = { school: { id: 'school-1' } };
    if (path === '/lms/classrooms')
      data = [
        { id: 'first', name: 'Science' },
        { id: 'second', name: 'English' },
      ];
    if (path === '/lms/assignments') {
      if (options.params.classroomId === 'first') {
        firstSignal = options.signal;
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      data = [{ id: 'new', title: 'Current essay' }];
    }
    return Promise.resolve({ data: { data } });
  });
  render(<StudentSubmissionCenter />);
  await waitFor(() => expect(resolveFirst).toBeTypeOf('function'));
  fireEvent.change(screen.getByRole('combobox', { name: 'Classroom' }), {
    target: { value: 'second' },
  });
  expect(await screen.findByText('Current essay')).toBeInTheDocument();
  expect(firstSignal.aborted).toBe(true);
  await act(async () => resolveFirst({ data: { data: [{ id: 'old', title: 'Stale essay' }] } }));
  expect(screen.queryByText('Stale essay')).not.toBeInTheDocument();
  expect(screen.getByText('Current essay')).toBeInTheDocument();
});
