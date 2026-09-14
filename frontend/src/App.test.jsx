import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App.jsx';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('App', () => {
  it('opens the public password reset route from an email link', async () => {
    window.history.replaceState({}, '', '/reset-password?token=test-link');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Choose a new password' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });
  it('renders the SAIS application identity and scaffold status', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', {
        name: /Run your entire school from one intelligent platform/i,
      })
    ).toBeInTheDocument();
    expect(await screen.findByText('Secure school operations')).toBeInTheDocument();
  });
});
