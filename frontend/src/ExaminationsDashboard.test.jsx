import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ExaminationsDashboard from './ExaminationsDashboard.jsx';
import { examinationNextTask } from './examinationGuidance.js';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const school = { id: 'school-1', name: 'Central School' };
let exams;
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  exams = [];
  api.get.mockImplementation(async (path) => ({
    data: { data: path === '/schools' ? { items: [school], total: 1 } : exams },
  }));
  api.post.mockImplementation(async () => {
    exams = [
      {
        id: 'exam-1',
        name: 'First term',
        code: 'TERM1',
        status: 'DRAFT',
        _count: { candidates: 0, schedules: 0, marks: 0 },
      },
    ];
    return { data: {} };
  });
});
afterEach(cleanup);
const show = () =>
  render(
    <MemoryRouter>
      <ExaminationsDashboard />
    </MemoryRouter>
  );

it('selects the saved school by name and updates next steps after draft creation', async () => {
  const user = userEvent.setup();
  show();
  await screen.findByRole('link', { name: 'Next: Create your first examination draft' });
  expect(screen.getByRole('combobox', { name: 'School' })).toHaveValue('school-1');
  await user.type(screen.getByRole('textbox', { name: 'Examination name' }), 'First term');
  await user.type(screen.getByRole('textbox', { name: 'Examination code' }), 'TERM1');
  await user.click(screen.getByRole('button', { name: 'Create draft' }));
  await screen.findByText('Register candidates from the students actively enrolled in each class.');
  expect(api.post).toHaveBeenCalledWith(
    '/examinations',
    { name: 'First term', code: 'TERM1' },
    { headers: { 'x-school-id': 'school-1' } }
  );
  expect(
    screen.queryByRole('link', { name: 'Next: Create your first examination draft' })
  ).not.toBeInTheDocument();
});

it('does not confuse a failed examination check with an empty register', async () => {
  const user = userEvent.setup();
  api.get.mockImplementation(async (path) => {
    if (path === '/schools') return { data: { data: { items: [school], total: 1 } } };
    throw new Error('Unavailable');
  });
  show();
  await screen.findByRole('alert');
  expect(screen.queryByText('No examinations configured')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
  api.get.mockResolvedValue({ data: { data: [] } });
  await user.click(screen.getByRole('button', { name: 'Reload examinations' }));
  await screen.findByText('No examinations configured');
});

it('directs a school with no records to school creation', async () => {
  api.get.mockResolvedValue({ data: { data: { items: [], total: 0 } } });
  show();
  expect(await screen.findByRole('link', { name: 'Create your school' })).toHaveAttribute(
    'href',
    '/school-setup'
  );
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
});

it('clears exam records and unsaved draft fields when switching schools', async () => {
  const user = userEvent.setup();
  sessionStorage.setItem('schoolId', 'school-1');
  api.get.mockImplementation(async (path, config) => ({
    data: {
      data:
        path === '/schools'
          ? { items: [school, { id: 'school-2', name: 'West School' }], total: 2 }
          : config.headers['x-school-id'] === 'school-1'
            ? [{ id: 'old', name: 'Old exam', status: 'LOCKED' }]
            : [],
    },
  }));
  show();
  await screen.findByText('Old exam');
  await user.type(screen.getByRole('textbox', { name: 'Examination name' }), 'Unsaved exam');
  await user.selectOptions(screen.getByRole('combobox', { name: 'School' }), 'school-2');
  await screen.findByText('No examinations configured');
  expect(screen.queryByText('Old exam')).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Examination name' })).toHaveValue('');
  await waitFor(() => expect(sessionStorage.getItem('schoolId')).toBe('school-2'));
});

it('offers results only for locked examinations', async () => {
  exams = [
    { id: 'locked', name: 'Locked exam', status: 'LOCKED' },
    { id: 'archived', name: 'Archived exam', status: 'ARCHIVED' },
  ];
  show();
  expect(await screen.findByRole('link', { name: 'Open result management' })).toHaveAttribute(
    'href',
    '/results'
  );
  expect(screen.getAllByRole('link', { name: 'Open result management' })).toHaveLength(1);
});

it('distinguishes missing counts, candidates, schedules, and reviewed drafts', () => {
  expect(examinationNextTask({ status: 'DRAFT' })).toMatch(/Refresh/);
  expect(examinationNextTask({ status: 'DRAFT', _count: { candidates: 2, schedules: 0 } })).toMatch(
    /Add subject schedules/
  );
  expect(examinationNextTask({ status: 'DRAFT', _count: { candidates: 2, schedules: 2 } })).toMatch(
    /Review the full candidate register/
  );
  expect(examinationNextTask({ status: 'MARKING' })).toMatch(/every required mark/);
});

it('starts a scheduled examination and opens marking only after it is in progress', async () => {
  const user = userEvent.setup();
  exams = [{ id: 'exam-1', name: 'First term', status: 'SCHEDULED' }];
  api.patch.mockImplementation(async (_path, body) => {
    exams = [{ ...exams[0], status: body.status }];
    return { data: {} };
  });
  show();
  await user.click(await screen.findByRole('button', { name: 'Start examination: First term' }));
  expect(api.patch).toHaveBeenCalledWith(
    '/examinations/exam-1/status',
    expect.objectContaining({ status: 'IN_PROGRESS' }),
    { headers: { 'x-school-id': 'school-1' } }
  );
  await user.click(await screen.findByRole('button', { name: 'Open marking: First term' }));
  await screen.findByText('MARKING');
  expect(api.patch).toHaveBeenLastCalledWith(
    '/examinations/exam-1/status',
    expect.objectContaining({ status: 'MARKING' }),
    { headers: { 'x-school-id': 'school-1' } }
  );
  expect(
    screen.queryByRole('button', { name: /Start examination:|Open marking:/ })
  ).not.toBeInTheDocument();
});

it('keeps a failed examination start at scheduled status and allows reloading', async () => {
  const user = userEvent.setup();
  exams = [{ id: 'exam-1', name: 'First term', status: 'SCHEDULED' }];
  api.patch.mockRejectedValue(new Error('Transition rejected'));
  show();
  await user.click(await screen.findByRole('button', { name: 'Start examination: First term' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('IN_PROGRESS')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reload examinations' }));
  await screen.findByRole('button', { name: 'Start examination: First term' });
});
