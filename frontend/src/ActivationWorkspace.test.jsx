import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ActivationWorkspace, { ActivationNotice } from './ActivationWorkspace.jsx';
import * as auth from './api/auth.js';
vi.mock('./api/auth.js', () => ({
  listActivationRequests: vi.fn(),
  decideActivationRequest: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const request = {
  id: 'one',
  email: 'admin@example.com',
  firstName: 'School',
  lastName: 'Admin',
  createdAt: '2026-09-06',
  expiresAt: '2026-09-13',
};
it('shows the pending count and a direct activation link', async () => {
  auth.listActivationRequests.mockResolvedValue([request]);
  render(
    <MemoryRouter>
      <ActivationNotice />
    </MemoryRouter>
  );
  expect(
    await screen.findByText('1 school administrator account awaiting activation')
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review activations' })).toHaveAttribute(
    'href',
    '/owner/activations'
  );
});
it.each(['approve', 'reject'])('persists %s and removes the decided request', async (decision) => {
  auth.listActivationRequests.mockResolvedValue([request]);
  auth.decideActivationRequest.mockResolvedValue({
    status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
  });
  render(
    <MemoryRouter>
      <ActivationWorkspace />
    </MemoryRouter>
  );
  fireEvent.click(
    await screen.findByRole('button', {
      name: `${decision === 'approve' ? 'Activate' : 'Reject'} admin@example.com`,
    })
  );
  await waitFor(() => expect(auth.decideActivationRequest).toHaveBeenCalledWith('one', decision));
  expect(await screen.findByText('No pending activation requests.')).toBeInTheDocument();
});
it('retains the request and displays a failed decision', async () => {
  auth.listActivationRequests.mockResolvedValue([request]);
  auth.decideActivationRequest.mockRejectedValue(new Error('Request expired'));
  render(
    <MemoryRouter>
      <ActivationWorkspace />
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Activate admin@example.com' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Request expired');
  expect(screen.getByText('admin@example.com')).toBeInTheDocument();
});
it('does not report an empty queue when loading fails', async () => {
  auth.listActivationRequests.mockRejectedValue(new Error('Unable to connect'));
  render(
    <MemoryRouter>
      <ActivationWorkspace />
    </MemoryRouter>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect');
  expect(screen.queryByText('No pending activation requests.')).not.toBeInTheDocument();
});
