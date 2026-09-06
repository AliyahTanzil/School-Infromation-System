import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App.jsx';
import api, { setAccessToken } from './api/auth.js';

vi.mock('./context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { roles: ['PLATFORM_ADMIN'] }, loading: false }),
}));

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setAccessToken(null);
  window.history.replaceState({}, '', '/');
});

it('opens Subjects from administration for a platform administrator using the active session', async () => {
  const adapter = vi.fn(async (config) => ({
    data: { data: [{ id: 'math', code: 'MATH', name: 'Mathematics', status: 'ACTIVE' }] },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }));
  api.defaults.adapter = adapter;
  setAccessToken('subject-test-token');
  window.history.replaceState({}, '', '/admin');
  render(<App />);
  fireEvent.click(await screen.findByRole('link', { name: /Subjects School subject codes/ }));
  expect(await screen.findByRole('heading', { name: 'Subjects' })).toBeInTheDocument();
  expect(await screen.findByText('Mathematics')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/subjects');
  expect(screen.queryByRole('heading', { name: 'Manage schools' })).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Select or paste the school UUID')).not.toBeInTheDocument();
  expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer subject-test-token');
  fireEvent.click(screen.getByRole('link', { name: 'Back to administration' }));
  expect(
    await screen.findByRole('heading', { name: 'Manage your school administration platform.' })
  ).toBeInTheDocument();
});
