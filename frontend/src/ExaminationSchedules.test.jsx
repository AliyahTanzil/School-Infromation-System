import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ExaminationSchedules from './ExaminationSchedules.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const examination = { id: 'exam-1', name: 'First term', status: 'DRAFT' };
const onSaved = vi.fn();
const onBusy = vi.fn();
const onCandidates = vi.fn();
let detail;
let klass;
beforeEach(() => {
  vi.resetAllMocks();
  detail = {
    ...examination,
    candidates: [{ classId: 'class-1' }, { classId: 'class-1' }],
    schedules: [],
  };
  klass = {
    id: 'class-1',
    name: 'Grade 7',
    subjects: [
      { subject: { id: 'math', name: 'Mathematics', code: 'MATH', status: 'ACTIVE' } },
      { subject: { id: 'inactive', name: 'Old subject', code: 'OLD', status: 'INACTIVE' } },
    ],
  };
  api.get.mockImplementation(async (path) => ({
    data: { data: path === '/examinations/exam-1' ? detail : klass },
  }));
  api.post.mockResolvedValue({ data: {} });
  api.patch.mockResolvedValue({ data: {} });
});
afterEach(cleanup);
const show = () =>
  render(
    <MemoryRouter>
      <ExaminationSchedules
        schoolId="school-1"
        examination={examination}
        onSaved={onSaved}
        onBusy={onBusy}
        onCandidates={onCandidates}
      />
    </MemoryRouter>
  );
async function selectSubject(user) {
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Examination class' }),
    'class-1'
  );
  await user.selectOptions(screen.getByRole('combobox', { name: 'Examination subject' }), 'MATH');
}

it('saves a candidate class subject with a date converted from device time to UTC', async () => {
  const user = userEvent.setup();
  show();
  await selectSubject(user);
  expect(screen.queryByRole('option', { name: 'Old subject (OLD)' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Examination date and time'), {
    target: { value: '2026-10-15T09:30' },
  });
  await user.click(screen.getByRole('button', { name: 'Save subject schedule' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith(
    '/examinations/exam-1/schedules',
    {
      classId: 'class-1',
      subjectCode: 'MATH',
      scheduledAt: new Date('2026-10-15T09:30').toISOString(),
    },
    { headers: { 'x-school-id': 'school-1' } }
  );
  expect(api.get.mock.calls.filter(([path]) => path === '/classes/class-1')).toHaveLength(1);
  for (const [, config] of api.get.mock.calls)
    expect(config.headers['x-school-id']).toBe('school-1');
  expect(onBusy.mock.calls).toEqual([[true], [false]]);
});

it('prefills an existing schedule and clearly updates the same class and subject', async () => {
  const user = userEvent.setup();
  detail.schedules = [
    {
      id: 'schedule-1',
      classId: 'class-1',
      subjectCode: 'MATH',
      scheduledAt: new Date('2026-10-15T09:30').toISOString(),
    },
  ];
  show();
  await selectSubject(user);
  expect(screen.getByLabelText('Examination date and time')).toHaveValue('2026-10-15T09:30');
  expect(screen.getByText(/Saving updates its date and time/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Examination date and time'), {
    target: { value: '2026-10-16T10:00' },
  });
  await user.click(screen.getByRole('button', { name: 'Update subject schedule' }));
  expect(api.post).toHaveBeenCalledWith(
    '/examinations/exam-1/schedules',
    expect.objectContaining({ scheduledAt: new Date('2026-10-16T10:00').toISOString() }),
    expect.anything()
  );
});

it('directs users to candidate registration before scheduling and does not fetch unrelated classes', async () => {
  const user = userEvent.setup();
  detail.candidates = [];
  show();
  await user.click(await screen.findByRole('button', { name: 'Register candidates first' }));
  expect(onCandidates).toHaveBeenCalledOnce();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Save subject schedule' })).not.toBeInTheDocument();
});

it('links to class preparation when no active subjects are attached', async () => {
  const user = userEvent.setup();
  klass.subjects = [];
  show();
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Examination class' }),
    'class-1'
  );
  expect(screen.getByRole('link', { name: 'Attach subjects to this class' })).toHaveAttribute(
    'href',
    '/classes/class-1'
  );
  expect(screen.getByRole('button', { name: 'Save subject schedule' })).toBeDisabled();
});

it('does not advance progress after a failed save', async () => {
  const user = userEvent.setup();
  api.post.mockRejectedValue(new Error('Unavailable'));
  show();
  await selectSubject(user);
  fireEvent.change(screen.getByLabelText('Examination date and time'), {
    target: { value: '2026-10-15T09:30' },
  });
  await user.click(screen.getByRole('button', { name: 'Save subject schedule' }));
  await screen.findByRole('alert');
  expect(onSaved).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Retry subject scheduling' }));
  await screen.findByText('No subject schedules saved yet.');
});

it('prevents scheduling if the saved examination has left draft status', async () => {
  detail.status = 'SCHEDULED';
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('no longer a draft');
  expect(screen.queryByRole('button', { name: 'Save subject schedule' })).not.toBeInTheDocument();
});

const savedSchedule = {
  id: 'schedule-1',
  classId: 'class-1',
  subjectCode: 'MATH',
  scheduledAt: '2026-10-15T09:30:00.000Z',
};

it('reviews saved preparation and schedules the exam using its school context', async () => {
  const user = userEvent.setup();
  detail.schedules = [savedSchedule];
  show();
  await screen.findByText(
    '2 registered candidate(s) across 1 class(es); 1 saved subject schedule(s).'
  );
  await user.click(screen.getByRole('button', { name: 'Mark examination as scheduled' }));
  await waitFor(() =>
    expect(onSaved).toHaveBeenCalledWith(expect.stringContaining('Examination scheduled.'))
  );
  expect(api.patch).toHaveBeenCalledWith(
    '/examinations/exam-1/status',
    {
      status: 'SCHEDULED',
      reason: 'Candidate classes and subject schedules reviewed by school administration',
    },
    { headers: { 'x-school-id': 'school-1' } }
  );
  expect(screen.getByRole('status')).toHaveTextContent('Examination scheduled.');
  expect(
    screen.queryByRole('button', { name: 'Mark examination as scheduled' })
  ).not.toBeInTheDocument();
});

it('requires a saved schedule for every candidate class', async () => {
  detail.candidates.push({ classId: 'class-2' });
  detail.schedules = [savedSchedule];
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/examinations/exam-1'
          ? detail
          : path === '/classes/class-2'
            ? { ...klass, id: 'class-2', name: 'Grade 8' }
            : klass,
    },
  }));
  show();
  await screen.findByText(
    'Each candidate class needs a saved subject schedule before you continue.'
  );
  expect(screen.getByRole('button', { name: 'Mark examination as scheduled' })).toBeDisabled();
  expect(api.patch).not.toHaveBeenCalled();
});

it('does not schedule while an existing subject date has unsaved changes', async () => {
  const user = userEvent.setup();
  detail.schedules = [savedSchedule];
  show();
  await selectSubject(user);
  expect(screen.getByRole('button', { name: 'Mark examination as scheduled' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Examination date and time'), {
    target: { value: '2026-10-16T10:00' },
  });
  expect(screen.getByRole('button', { name: 'Mark examination as scheduled' })).toBeDisabled();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Examination subject' }), '');
  expect(screen.getByRole('button', { name: 'Mark examination as scheduled' })).toBeEnabled();
});

it('keeps a failed status transition from advancing the examination', async () => {
  const user = userEvent.setup();
  detail.schedules = [savedSchedule];
  api.patch.mockRejectedValue(new Error('Status change rejected'));
  show();
  await screen.findByRole('button', { name: 'Mark examination as scheduled' });
  await user.click(screen.getByRole('button', { name: 'Mark examination as scheduled' }));
  await screen.findByRole('alert');
  expect(onSaved).not.toHaveBeenCalled();
  expect(onBusy.mock.calls).toEqual([[true], [false]]);
  await user.click(screen.getByRole('button', { name: 'Retry subject scheduling' }));
  expect(
    await screen.findByRole('button', { name: 'Mark examination as scheduled' })
  ).toBeEnabled();
});
