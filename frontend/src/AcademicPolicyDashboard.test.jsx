import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AcademicPolicyDashboard from './AcademicPolicyDashboard.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const school = { id: 'school-1', name: 'Central School' };
const policy = {
  id: 'policy-1',
  name: 'Standard policy',
  code: 'STANDARD',
  status: 'DRAFT',
  passMark: 50,
  effectiveFrom: '2026-01-01',
  bands: [],
  weights: [],
};
let policies;
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  policies = [];
  api.get.mockImplementation(async (path) => ({
    data: { data: path === '/schools' ? { items: [school], total: 1 } : policies },
  }));
  api.post.mockImplementation(async () => {
    policies = [policy];
    return { data: {} };
  });
  api.patch.mockImplementation(async () => {
    policies = [{ ...policy, status: 'ACTIVE' }];
    return { data: {} };
  });
});
afterEach(cleanup);
const show = () =>
  render(
    <MemoryRouter>
      <AcademicPolicyDashboard />
    </MemoryRouter>
  );

it('selects the school by name and guides creation, activation, and examinations', async () => {
  const user = userEvent.setup();
  show();
  await screen.findByRole('link', { name: 'Next: Create your grading policy' });
  expect(screen.getByRole('combobox', { name: 'School' })).toHaveValue('school-1');
  expect(screen.queryByPlaceholderText('School UUID')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create draft' }));
  await screen.findByRole('link', { name: 'Next: Review and activate a draft' });
  expect(api.post).toHaveBeenCalledWith(
    '/academic-policies',
    expect.objectContaining({ passMark: 50 }),
    { headers: { 'x-school-id': 'school-1' } }
  );
  await user.click(screen.getByRole('button', { name: 'Activate' }));
  expect(await screen.findByRole('link', { name: 'Continue to examinations' })).toHaveAttribute(
    'href',
    '/examinations'
  );
  expect(api.patch).toHaveBeenCalledWith(
    '/academic-policies/policy-1/status',
    expect.objectContaining({ status: 'ACTIVE' }),
    { headers: { 'x-school-id': 'school-1' } }
  );
});

it('directs users to create a school when none exist', async () => {
  api.get.mockResolvedValue({ data: { data: { items: [], total: 0 } } });
  show();
  expect(await screen.findByRole('link', { name: 'Create your school' })).toHaveAttribute(
    'href',
    '/school-setup'
  );
  expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
  expect(api.get).toHaveBeenCalledTimes(1);
});

it('does not treat failed policy loading as an empty setup and allows retry', async () => {
  const user = userEvent.setup();
  api.get.mockImplementation(async (path) => {
    if (path === '/schools') return { data: { data: { items: [school], total: 1 } } };
    throw new Error('Unavailable');
  });
  show();
  await screen.findByRole('alert');
  expect(screen.queryByText('No grading policies found.')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Next: Create your grading policy' })
  ).not.toBeInTheDocument();
  api.get.mockResolvedValue({ data: { data: [] } });
  await user.click(screen.getByRole('button', { name: 'Reload policies' }));
  await screen.findByRole('link', { name: 'Next: Create your grading policy' });
});

it('requires a school selection when a remembered school is unavailable', async () => {
  sessionStorage.setItem('schoolId', 'unavailable-school');
  api.get.mockResolvedValue({
    data: { data: { items: [school, { id: 'school-2', name: 'West School' }], total: 2 } },
  });
  show();
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'School' })).toBeEnabled());
  expect(screen.getByRole('combobox', { name: 'School' })).toHaveValue('');
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
});

it('keeps a failed activation from advancing the guide', async () => {
  const user = userEvent.setup();
  policies = [policy];
  api.patch.mockRejectedValue(new Error('Activation failed'));
  show();
  await screen.findByRole('link', { name: 'Next: Review and activate a draft' });
  await user.click(screen.getByRole('button', { name: 'Activate' }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('link', { name: 'Continue to examinations' })).not.toBeInTheDocument();
});
