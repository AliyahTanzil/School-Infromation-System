import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from './api/auth.js';
import SecurityAdminDashboard from './SecurityAdminDashboard.jsx';
vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));
const sessions = [
  { id: 'current', deviceName: 'This laptop', current: true },
  { id: 'other', deviceName: 'Old phone', current: false },
];
const renderPage = () =>
  render(
    <MemoryRouter>
      <SecurityAdminDashboard />
    </MemoryRouter>
  );
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

it('loads actual account sessions and removes a device only after successful revocation', async () => {
  api.get.mockResolvedValue({ data: { data: { sessions } } });
  let finish;
  api.delete.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  renderPage();
  expect(await screen.findByText('2 active sessions')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/auth/sessions');
  expect(
    screen.queryByRole('button', { name: 'Revoke session for This laptop' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Revoke session for Old phone' }));
  expect(api.delete).toHaveBeenCalledWith('/auth/sessions/other');
  expect(screen.getByText('Old phone')).toBeInTheDocument();
  finish({});
  expect(await screen.findByText('1 active session')).toBeInTheDocument();
  expect(screen.queryByText('Old phone')).not.toBeInTheDocument();
  expect(screen.queryByText('Strong posture')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Export evidence' })).not.toBeInTheDocument();
});

it('preserves a session and shows an error when revocation fails', async () => {
  api.get.mockResolvedValue({ data: { data: { sessions } } });
  api.delete.mockRejectedValue(new Error('Unable to revoke'));
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Revoke session for Old phone' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to revoke');
  expect(screen.getByText('Old phone')).toBeInTheDocument();
  expect(screen.queryByText(/Session revoked/)).not.toBeInTheDocument();
});

it('shows load errors without claiming zero sessions and supports retry', async () => {
  api.get
    .mockRejectedValueOnce(new Error('Service unavailable'))
    .mockResolvedValueOnce({ data: { data: { sessions: [] } } });
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
  expect(screen.queryByText('0 active sessions')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }));
  expect(await screen.findByText('No active sessions found.')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
