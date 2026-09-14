import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import TeacherDashboard from './TeacherDashboard.jsx';
import api from './api/auth.js';

const { auth } = vi.hoisted(() => ({ auth: { user: { platformRole: 'OWNER', roles: [] } } }));
vi.mock('./context/AuthContext.jsx', () => ({ useAuth: () => auth }));
const originalAdapter = api.defaults.adapter;
afterEach(() => {
  cleanup();
  api.defaults.adapter = originalAdapter;
  auth.user = { platformRole: 'OWNER', roles: [] };
});
function show(adapter) {
  api.defaults.adapter = adapter;
  render(
    <MemoryRouter>
      <TeacherDashboard />
    </MemoryRouter>
  );
}
const response = (config, data) => ({
  data: { data },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});
it.each([{ platformRole: 'OWNER', roles: [] }, { roles: ['SCHOOL_ADMIN'] }])(
  'opens school teacher management for administrators without calling teacher self APIs (%j)',
  async (user) => {
    auth.user = user;
    const adapter = vi.fn(async (config) =>
      response(config, [
        {
          id: 't',
          employeeNumber: 'T-1',
          status: 'ACTIVE',
          profile: { firstName: 'Real', lastName: 'Teacher' },
        },
      ])
    );
    show(adapter);
    expect(await screen.findByText('Real Teacher')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Teacher management' })).toBeInTheDocument();
    expect(adapter.mock.calls.map(([config]) => config.url)).toEqual(['/teachers']);
  }
);
it('keeps teachers on the personal workspace API', async () => {
  auth.user = { roles: ['TEACHER'], accountType: 'TEACHER' };
  const adapter = vi.fn(async (config) =>
    response(config, config.url === '/teachers/me' ? null : [])
  );
  show(adapter);
  await screen.findByText(/teacher profile/i);
  expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
    '/teachers/me',
    '/lms/classrooms',
  ]);
  expect(screen.queryByRole('heading', { name: 'Teacher management' })).not.toBeInTheDocument();
});
it('creates and activates a persisted profile using the administrator APIs', async () => {
  let rows = [];
  const adapter = vi.fn(async (config) => {
    if (config.method === 'post') {
      rows = [
        {
          id: 't',
          status: 'APPLICANT',
          employeeNumber: 'T-RT-generated',
          ...JSON.parse(config.data),
        },
      ];
      return response(config, rows[0]);
    }
    if (config.method === 'patch') rows[0].status = 'ACTIVE';
    return response(config, rows);
  });
  show(adapter);
  await screen.findByText(/No teacher profiles/);
  for (const [label, value] of [
    ['First name', 'Real'],
    ['Last name', 'Teacher'],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  expect(screen.getByLabelText('Employee number')).toHaveAttribute('readonly');
  fireEvent.click(screen.getByRole('button', { name: 'Create teacher profile' }));
  expect(await screen.findByText(/Employee number: T-RT-generated/)).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Activate Real Teacher' }));
  expect(await screen.findByText('Real Teacher is active.')).toBeInTheDocument();
  const post = adapter.mock.calls.find(([c]) => c.method === 'post')[0];
  expect(JSON.parse(post.data)).toEqual({
    profile: { firstName: 'Real', lastName: 'Teacher' },
  });
  const patch = adapter.mock.calls.find(([c]) => c.method === 'patch')[0];
  expect(patch.url).toBe('/teachers/t/status');
  expect(JSON.parse(patch.data)).toEqual({ status: 'ACTIVE' });
});
it('shows server permission failures without claiming the owner needs a teacher profile', async () => {
  show(async () => {
    throw {
      response: {
        status: 403,
        data: { error: { message: 'Teacher administration permission required' } },
      },
    };
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Teacher administration permission required'
  );
  expect(
    screen.queryByText(/Your account does not have an active teacher profile/)
  ).not.toBeInTheDocument();
});
