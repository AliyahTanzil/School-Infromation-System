import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EmailSetup from './EmailSetup.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
const settings = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  user: 'user@example.com',
  from: 'school@example.com',
  frontendUrl: 'https://school.example.com',
  passwordConfigured: true,
  configured: true,
  source: 'database',
};
const show = () =>
  render(
    <MemoryRouter>
      <EmailSetup />
    </MemoryRouter>
  );
beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockResolvedValue({ data: { data: settings } });
});
afterEach(cleanup);
it('loads settings without exposing a stored password', async () => {
  show();
  expect(await screen.findByLabelText('SMTP server')).toHaveValue(settings.host);
  expect(screen.getByLabelText('SMTP password')).toHaveValue('');
  expect(screen.getByText(/A password is stored/)).toBeInTheDocument();
});
it('saves matching TLS and port values and clears the entered password after success', async () => {
  api.put.mockResolvedValue({ data: { data: { ...settings, port: 465, secure: true } } });
  show();
  await screen.findByLabelText('SMTP server');
  fireEvent.change(screen.getByLabelText('SMTP password'), {
    target: { value: 'new-app-password' },
  });
  fireEvent.change(screen.getByLabelText('Connection security and port'), {
    target: { value: '465' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verify connection and save' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Connection verified and settings saved'
  );
  expect(api.put).toHaveBeenCalledWith(
    '/settings/email',
    expect.objectContaining({ port: 465, secure: true, password: 'new-app-password' })
  );
  expect(screen.getByLabelText('SMTP password')).toHaveValue('');
});
it('failed verification shows an error without claiming activation', async () => {
  api.put.mockRejectedValue({
    response: {
      data: { error: { message: 'SMTP connection failed. Previous settings are unchanged.' } },
    },
  });
  show();
  await screen.findByLabelText('SMTP server');
  fireEvent.click(screen.getByRole('button', { name: 'Verify connection and save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Previous settings are unchanged');
  expect(screen.queryByText(/Connection verified and settings saved/)).not.toBeInTheDocument();
});
it('requires a replacement password when changing the credential destination', async () => {
  show();
  await screen.findByLabelText('SMTP server');
  expect(screen.getByLabelText('SMTP password')).not.toBeRequired();
  fireEvent.change(screen.getByLabelText('SMTP server'), { target: { value: 'new.example.com' } });
  expect(screen.getByLabelText('SMTP password')).toBeRequired();
});
it('blocks editing after a failed load and supports retry', async () => {
  api.get.mockRejectedValueOnce(new Error('Service unavailable'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
  expect(
    screen.queryByRole('button', { name: 'Verify connection and save' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading settings' }));
  await waitFor(() => expect(screen.getByLabelText('SMTP server')).toHaveValue(settings.host));
});
