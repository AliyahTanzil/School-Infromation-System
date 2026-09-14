import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import FinanceDashboard from './FinanceDashboard.jsx';
import HRDashboard from './HRDashboard.jsx';
import LibraryDashboard from './LibraryDashboard.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});
const show = (Component) =>
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  );
const respond = (path) => ({
  data: {
    data:
      path === '/school'
        ? { school: { id: 'school-1' } }
        : path === '/hr/dashboard'
          ? { payrollRuns: [], departments: [], positions: [] }
          : path.endsWith('/summary') || path.endsWith('/overview')
            ? {}
            : [],
  },
});

it.each([
  ['Finance', FinanceDashboard],
  ['HR', HRDashboard],
  ['Library', LibraryDashboard],
])('keeps %s unavailable without a configured school', async (_name, Component) => {
  sessionStorage.setItem('sais.schoolId', 'foreign-school');
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  show(Component);
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});

it.each([
  ['Finance', FinanceDashboard, '/finance/invoices'],
  ['HR', HRDashboard, '/hr/employees'],
])(
  'loads %s using authenticated scope without request school overrides',
  async (_name, Component, path) => {
    api.get.mockImplementation(async (url) => respond(url));
    show(Component);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(path));
    for (const [url, config] of api.get.mock.calls) {
      if (url !== '/school') expect(config).toBeUndefined();
    }
  }
);

it('creates and reads a library without client school overrides', async () => {
  api.get.mockImplementation(async (url) => respond(url));
  api.post.mockResolvedValue({ data: { data: { id: 'library-1' } } });
  show(LibraryDashboard);
  fireEvent.click(await screen.findByRole('button', { name: 'Create school library' }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/libraries/library-1/books'));
  expect(api.post).toHaveBeenCalledWith('/libraries', { name: 'School Library' });
  expect(api.get).toHaveBeenCalledWith('/libraries/library-1/overview');
  expect(api.get).toHaveBeenCalledWith('/libraries/library-1/loans');
});
