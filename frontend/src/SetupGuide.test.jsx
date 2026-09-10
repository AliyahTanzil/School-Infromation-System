import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SetupGuide from './SetupGuide.jsx';
import api from './api/auth.js';
import { notifySetupChanges } from './setupProgressEvents.js';

const identity = vi.hoisted(() => ({ user: { id: 'admin', accountType: 'TENANT_ADMIN' } }));
afterEach(cleanup);
vi.mock('./context/AuthContext.jsx', () => ({ useAuth: () => identity }));
vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));

function show(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SetupGuide />
    </MemoryRouter>
  );
}
beforeEach(() => {
  identity.user = { id: 'admin', accountType: 'TENANT_ADMIN' };
  api.get.mockReset();
  api.get.mockResolvedValue({ data: { data: { items: [] } } });
});

it('starts with the school and does not request dependent resources until it exists', async () => {
  show();
  expect(
    await screen.findByText('0 of 7 foundation steps have saved records.')
  ).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith('/schools', expect.anything());
  expect(screen.getByText('Start here:').parentElement.querySelector('a')).toHaveAttribute(
    'href',
    '/school-setup'
  );
});

it('distinguishes a year from a term and directs teacher creation to user management', async () => {
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/academic-periods'
          ? [{ type: 'YEAR' }]
          : { items: [{ id: 'record', accountType: 'TEACHER' }] },
    },
  }));
  show();
  expect(
    await screen.findByText('6 of 7 foundation steps have saved records.')
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Create terms' })).toHaveAttribute(
    'href',
    '/academic-calendar'
  );
  expect(screen.getByRole('link', { name: 'Open create teacher accounts' })).toHaveAttribute(
    'href',
    '/users'
  );
  expect(api.get.mock.calls.filter(([path]) => path === '/academic-periods')).toHaveLength(1);
  expect(api.get).toHaveBeenCalledWith('/users', { params: { pageSize: 100 } });
});

it('does not turn a failed check into an empty or completed step and allows retry', async () => {
  api.get.mockRejectedValue(new Error('Forbidden'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Some progress could not be checked');
  const schoolRow = screen.getByText('1. Create your school').closest('li');
  expect(within(schoolRow).getByText('Unable to check')).toBeInTheDocument();
  api.get.mockResolvedValue({ data: { data: { items: [] } } });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh progress' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(within(schoolRow).getByText('To do')).toBeInTheDocument();
});

it('updates progress from saved records on refresh', async () => {
  show();
  await screen.findByText('0 of 7 foundation steps have saved records.');
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/academic-periods'
          ? [{ type: 'YEAR' }, { type: 'TERM' }]
          : { items: [{ id: 'saved', accountType: 'TEACHER' }] },
    },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh progress' }));
  expect(
    await screen.findByText('7 of 7 foundation steps have saved records.')
  ).toBeInTheDocument();
  expect(screen.getByText(/Your foundation records are in place/)).toBeInTheDocument();
});

it('checks saved prerequisites on a module page', async () => {
  show('/academic-calendar');
  expect(screen.getByRole('complementary')).toHaveTextContent('Select the parent year');
  expect(screen.getByRole('link', { name: 'School setup guide' })).toHaveAttribute(
    'href',
    '/admin#setup-guide'
  );
  expect(
    await screen.findByRole('link', { name: 'Continue setup: Create your school' })
  ).toHaveAttribute('href', '/school-setup');
});

it('does not show administrative setup or fetch records for students', () => {
  identity.user = { id: 'student', accountType: 'STUDENT' };
  const { container } = show();
  expect(container).toBeEmptyDOMElement();
  expect(api.get).not.toHaveBeenCalled();
});

it('shows numbered tasks and continues past saved calendar steps to classes', async () => {
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/schools'
          ? { items: [{ id: 'school' }] }
          : path === '/academic-periods'
            ? [{ type: 'YEAR' }, { type: 'TERM' }]
            : { items: [] },
    },
  }));
  show('/academic-calendar');
  expect(screen.getByText('Step 2 of 7: Create an academic year')).toBeInTheDocument();
  expect(screen.getByText('Step 3 of 7: Create terms')).toBeInTheDocument();
  expect(
    await screen.findByRole('link', { name: 'Continue setup: Create classes' })
  ).toHaveAttribute('href', '/classes');
});

it('links missing prerequisites and removes them once saved records are detected', async () => {
  show();
  await screen.findByText('0 of 7 foundation steps have saved records.');
  const subjectRow = screen.getByText('6. Create subjects').closest('li');
  expect(within(subjectRow).getByRole('link', { name: 'Create classes' })).toHaveAttribute(
    'href',
    '/classes'
  );
  api.get.mockImplementation(async (path) => ({
    data: { data: { items: ['/schools', '/classes'].includes(path) ? [{ id: 'saved' }] : [] } },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh progress' }));
  await screen.findByText('2 of 7 foundation steps have saved records.');
  expect(within(subjectRow).queryByText('Prepare first:')).not.toBeInTheDocument();
});

it('leads from the last foundation task back to progress and further setup', async () => {
  show('/students');
  expect(screen.getByRole('link', { name: 'View full setup guide' })).toHaveAttribute(
    'href',
    '/admin#setup-guide'
  );
  expect(screen.queryByText(/After saving:/)).not.toBeInTheDocument();
  await screen.findByText('Recommended next task: Create your school.');
});

it('shows preparation links for daily operations', async () => {
  show('/attendance');
  expect(await screen.findByRole('link', { name: 'Create classes' })).toHaveAttribute(
    'href',
    '/classes'
  );
  expect(screen.getByRole('link', { name: 'Add students' })).toHaveAttribute('href', '/students');
});

it('rechecks after saving on the current page and recommends the next missing task', async () => {
  show('/school-setup');
  await screen.findByText(/Your next task is on this page: Create your school/);
  api.get.mockImplementation(async (path) => ({
    data: { data: { items: path === '/schools' ? [{ id: 'school' }] : [] } },
  }));
  act(() => notifySetupChanges({ config: { method: 'post', url: '/schools' } }));
  expect(
    await screen.findByRole('link', { name: 'Continue setup: Create an academic year' })
  ).toHaveAttribute('href', '/academic-calendar');
  expect(screen.queryByText('Prepare first:')).not.toBeInTheDocument();
});

it('keeps the user on the calendar when a year exists but terms are missing', async () => {
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/academic-periods'
          ? [{ type: 'YEAR' }]
          : { items: [{ id: 'saved', accountType: 'TEACHER' }] },
    },
  }));
  show('/academic-calendar');
  await screen.findByText(/Your next task is on this page: Create terms/);
  expect(screen.queryByRole('link', { name: /Continue setup:/ })).not.toBeInTheDocument();
});
