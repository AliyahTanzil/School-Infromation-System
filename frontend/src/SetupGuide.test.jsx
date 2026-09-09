import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SetupGuide from './SetupGuide.jsx';
import api from './api/auth.js';

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
  expect(screen.getByRole('link', { name: 'Create your school' })).toHaveAttribute(
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

it('shows contextual prerequisites without fetching the checklist on a module page', () => {
  show('/academic-calendar');
  expect(screen.getByRole('complementary')).toHaveTextContent('Select the parent year');
  expect(screen.getByRole('link', { name: 'School setup guide' })).toHaveAttribute(
    'href',
    '/admin#setup-guide'
  );
  expect(api.get).not.toHaveBeenCalled();
});

it('does not show administrative setup or fetch records for students', () => {
  identity.user = { id: 'student', accountType: 'STUDENT' };
  const { container } = show();
  expect(container).toBeEmptyDOMElement();
  expect(api.get).not.toHaveBeenCalled();
});
