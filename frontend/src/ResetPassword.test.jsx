import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ResetPassword from './ResetPassword.jsx';

const { resetPassword } = vi.hoisted(() => ({ resetPassword: vi.fn() }));
vi.mock('./context/AuthContext.jsx', () => ({ useAuth: () => ({ resetPassword }) }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function Location() {
  return <span data-testid="location">{useLocation().search}</span>;
}
function show(path = '/reset-password?token=recovery-token') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPassword />
      <Location />
    </MemoryRouter>
  );
}
function fill(value = 'StrongPassword!42', confirmation = value) {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: confirmation },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
}
it('rejects missing reset links without presenting a password form', () => {
  show('/reset-password');
  expect(screen.getByRole('alert')).toHaveTextContent('missing or invalid');
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  expect(resetPassword).not.toHaveBeenCalled();
});
it('requires matching passwords before requesting a reset', () => {
  show();
  fill('StrongPassword!42', 'DifferentPassword!42');
  expect(screen.getByRole('alert')).toHaveTextContent('do not match');
  expect(resetPassword).not.toHaveBeenCalled();
});
it('submits the token and password and removes the token from the URL after success', async () => {
  resetPassword.mockResolvedValue({});
  show();
  fill();
  expect(await screen.findByRole('status')).toHaveTextContent('password has been reset');
  expect(resetPassword).toHaveBeenCalledWith({
    token: 'recovery-token',
    password: 'StrongPassword!42',
  });
  expect(screen.getByTestId('location').textContent).toBe('');
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
});
it('shows expired-link failures and offers a new reset request', async () => {
  resetPassword.mockRejectedValue({
    response: {
      status: 401,
      data: { error: { message: 'This password reset link is invalid or has expired' } },
    },
  });
  show();
  fill();
  expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired');
  expect(screen.getByRole('link', { name: 'Request a new reset link' })).toHaveAttribute(
    'href',
    '/forgot-password'
  );
  expect(screen.getByRole('button', { name: 'Reset password' })).toBeEnabled();
});
