import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
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
