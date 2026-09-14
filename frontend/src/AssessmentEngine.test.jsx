import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AssessmentEngine from './AssessmentEngine.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});

it('waits for school recovery and loads quizzes without using the cached school', async () => {
  sessionStorage.setItem('sais.schoolId', 'foreign-school');
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  api.get.mockRejectedValueOnce(new Error('School unavailable'));
  render(<AssessmentEngine />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(await screen.findByText('School unavailable')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByPlaceholderText('School UUID')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Create draft/ })).not.toBeInTheDocument();
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/school'
          ? { school: { id: 'current-school' } }
          : path === '/lms/classrooms'
            ? [{ id: 'classroom-1', name: 'Science' }]
            : [],
    },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith('/lms/quizzes', { params: { classroomId: 'classroom-1' } })
  );
  expect(sessionStorage.getItem('sais.schoolId')).toBe('foreign-school');
});

it('keeps quiz operations unavailable when no school exists', async () => {
  sessionStorage.setItem('sais.schoolId', 'foreign-school');
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  render(<AssessmentEngine />);
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByPlaceholderText('Quiz title')).not.toBeInTheDocument();
});

it('creates a quiz and reads its details without sending a school override', async () => {
  sessionStorage.setItem('sais.classroomId', 'classroom-1');
  const quiz = {
    id: 'quiz-1',
    title: 'Science quiz',
    status: 'DRAFT',
    questions: [],
    attempts: [],
    durationMinutes: 30,
  };
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/school'
          ? { school: { id: 'school-1' } }
          : path === '/lms/classrooms'
            ? [{ id: 'classroom-1', name: 'Science' }]
            : path === '/lms/quizzes'
              ? []
              : quiz,
    },
  }));
  api.post.mockResolvedValue({ data: { data: quiz } });
  render(<AssessmentEngine />);
  fireEvent.change(await screen.findByPlaceholderText('Quiz title'), {
    target: { value: 'Science quiz' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Create draft/ }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith('/lms/quizzes', {
      title: 'Science quiz',
      instructions: '',
      classroomId: 'classroom-1',
      durationMinutes: 30,
      maxAttempts: 1,
    })
  );
  expect(await screen.findByRole('heading', { name: 'Science quiz' })).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/lms/quizzes/quiz-1');
});

it('retries classroom loading and keeps quiz authoring hidden for empty membership', async () => {
  sessionStorage.setItem('sais.classroomId', 'foreign-classroom');
  let failed = true;
  api.get.mockImplementation(async (path) => {
    if (path === '/school') return { data: { data: { school: { id: 'school-1' } } } };
    if (failed) throw new Error('Classrooms unavailable');
    return { data: { data: [] } };
  });
  render(<AssessmentEngine />);
  expect(await screen.findByText('Classrooms unavailable')).toBeInTheDocument();
  expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/school', '/lms/classrooms']);
  failed = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No accessible classrooms')).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Classroom UUID')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Create draft/ })).not.toBeInTheDocument();
});

it('ignores quiz details that arrive after switching classrooms', async () => {
  let resolveDetails;
  api.get.mockImplementation((path, options) => {
    if (path === '/lms/quizzes/old')
      return new Promise((resolve) => {
        resolveDetails = resolve;
      });
    const data =
      path === '/school'
        ? { school: { id: 'school-1' } }
        : path === '/lms/classrooms'
          ? [
              { id: 'first', name: 'Science' },
              { id: 'second', name: 'English' },
            ]
          : options.params.classroomId === 'first'
            ? [{ id: 'old', title: 'Old quiz', status: 'PUBLISHED', _count: { questions: 0 } }]
            : [];
    return Promise.resolve({ data: { data } });
  });
  render(<AssessmentEngine />);
  fireEvent.click(await screen.findByRole('button', { name: /Old quiz/ }));
  await waitFor(() => expect(resolveDetails).toBeTypeOf('function'));
  fireEvent.change(screen.getByRole('combobox', { name: 'Classroom' }), {
    target: { value: 'second' },
  });
  await act(async () =>
    resolveDetails({
      data: {
        data: { id: 'old', title: 'Old quiz', status: 'PUBLISHED', questions: [], attempts: [] },
      },
    })
  );
  expect(screen.queryByRole('heading', { name: 'Old quiz' })).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Classroom' })).toHaveValue('second');
});
