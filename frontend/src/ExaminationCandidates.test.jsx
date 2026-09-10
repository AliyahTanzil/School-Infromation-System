import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ExaminationCandidates from './ExaminationCandidates.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const exam = { id: 'exam-1', name: 'First term', status: 'DRAFT' };
const student = {
  id: 'student-1',
  status: 'ACTIVE',
  admissionNumber: 'S001',
  profile: { firstName: 'Ada', lastName: 'Cole' },
};
const onSaved = vi.fn();
const onBusy = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/classes'
          ? { items: [{ id: 'class-1', name: 'Grade 7' }], total: 1 }
          : path === '/examinations/exam-1'
            ? { ...exam, candidates: [] }
            : { enrollments: [{ status: 'ACTIVE', student }] },
    },
  }));
  api.post.mockResolvedValue({ data: {} });
});
afterEach(cleanup);
const show = () =>
  render(
    <MemoryRouter>
      <ExaminationCandidates
        schoolId="school-1"
        examination={exam}
        onSaved={onSaved}
        onBusy={onBusy}
      />
    </MemoryRouter>
  );

it('registers an enrolled student with the selected school and refreshes saved progress', async () => {
  const user = userEvent.setup();
  show();
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Candidate class' }),
    'class-1'
  );
  await screen.findByRole('option', { name: 'Ada Cole · S001' });
  await user.selectOptions(screen.getByRole('combobox', { name: 'Enrolled student' }), 'student-1');
  await user.click(screen.getByRole('button', { name: 'Register candidate' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith(
    '/examinations/exam-1/candidates',
    { classId: 'class-1', studentId: 'student-1' },
    { headers: { 'x-school-id': 'school-1' } }
  );
  expect(screen.getByText(/1 candidate\(s\) registered/)).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Ada Cole · S001' })).not.toBeInTheDocument();
  expect(onBusy.mock.calls).toEqual([[true], [false]]);
  for (const [, config] of api.get.mock.calls)
    expect(config.headers['x-school-id']).toBe('school-1');
});

it('excludes registered candidates and inactive students from class choices', async () => {
  const user = userEvent.setup();
  const original = api.get.getMockImplementation();
  api.get.mockImplementation((path, config) => {
    if (path === '/examinations/exam-1')
      return Promise.resolve({
        data: { data: { ...exam, candidates: [{ studentId: 'student-1' }] } },
      });
    if (path === '/classes/class-1')
      return Promise.resolve({
        data: {
          data: {
            enrollments: [
              { status: 'ACTIVE', student },
              { status: 'ACTIVE', student: { ...student, id: 'inactive', status: 'INACTIVE' } },
              { status: 'INACTIVE', student: { ...student, id: 'unenrolled' } },
            ],
          },
        },
      });
    return original(path, config);
  });
  show();
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Candidate class' }),
    'class-1'
  );
  expect(await screen.findByRole('link', { name: 'Review class enrollments' })).toHaveAttribute(
    'href',
    '/classes/class-1'
  );
  expect(screen.getByRole('button', { name: 'Register candidate' })).toBeDisabled();
});

it('does not mark a failed save as registration and supports retry', async () => {
  const user = userEvent.setup();
  api.post.mockRejectedValue(new Error('Save failed'));
  show();
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Candidate class' }),
    'class-1'
  );
  await screen.findByRole('option', { name: 'Ada Cole · S001' });
  await user.selectOptions(screen.getByRole('combobox', { name: 'Enrolled student' }), 'student-1');
  await user.click(screen.getByRole('button', { name: 'Register candidate' }));
  await screen.findByRole('alert');
  expect(onSaved).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Retry candidate setup' }));
  await screen.findByText(/0 candidate\(s\) registered/);
});

it('blocks registration if the examination is no longer a draft', async () => {
  const original = api.get.getMockImplementation();
  api.get.mockImplementation((path, config) =>
    path === '/examinations/exam-1'
      ? Promise.resolve({ data: { data: { ...exam, status: 'LOCKED', candidates: [] } } })
      : original(path, config)
  );
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('no longer a draft');
  expect(screen.queryByRole('button', { name: 'Register candidate' })).not.toBeInTheDocument();
});

it('shows a retry for a failed class roster instead of claiming the class is empty', async () => {
  const user = userEvent.setup();
  const original = api.get.getMockImplementation();
  api.get.mockImplementation((path, config) =>
    path === '/classes/class-1' ? Promise.reject(new Error('Unavailable')) : original(path, config)
  );
  show();
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Candidate class' }),
    'class-1'
  );
  await screen.findByRole('button', { name: 'Retry students' });
  expect(screen.queryByRole('link', { name: 'Review class enrollments' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Register candidate' })).toBeDisabled();
});
