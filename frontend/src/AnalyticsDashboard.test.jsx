import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import api from './api/auth.js';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));
afterEach(cleanup);

it('shows a request failure without presenting demo analytics', async () => {
  api.get.mockRejectedValue(new Error('Analytics service unavailable'));
  render(<AnalyticsDashboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Analytics service unavailable');
  for (const value of ['2,486', '94.2%', '82.7%', '18.4']) {
    expect(screen.queryByText(value)).not.toBeInTheDocument();
  }
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
});

it('renders returned metrics and an empty historical series', async () => {
  api.get.mockResolvedValue({
    data: {
      data: {
        metrics: [{ label: 'Fee collection', value: '75%', change: null }],
        series: [],
      },
    },
  });
  render(<AnalyticsDashboard />);
  expect(await screen.findByText('75%')).toBeInTheDocument();
  expect(screen.getByText('Historical analytics are not available.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
