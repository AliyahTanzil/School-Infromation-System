import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the SAIS application identity and scaffold status', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /One clear view of your school/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Secure school operations')).toBeInTheDocument();
  });
});
