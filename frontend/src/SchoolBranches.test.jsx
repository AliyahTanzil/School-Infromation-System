import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SchoolBranches from './SchoolBranches.jsx';
import api from './api/auth.js';
const originalAdapter = api.defaults.adapter;
afterEach(() => {
  cleanup();
  api.defaults.adapter = originalAdapter;
});
it('creates a branch under the main school with no manual ID and edits its name', async () => {
  const adapter = vi.fn(async (config) => ({
    data: {
      data:
        config.method === 'get'
          ? []
          : {
              id: 'branch',
              schoolId: 'main',
              code: 'BRN-EAST-123',
              name: JSON.parse(config.data).name,
            },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }));
  api.defaults.adapter = adapter;
  render(<SchoolBranches schoolId="main" />);
  await screen.findByText('No branches yet.');
  fireEvent.change(screen.getByLabelText('Branch name'), { target: { value: 'East campus' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add branch' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Edit East campus' }));
  fireEvent.change(screen.getByLabelText('Branch name'), { target: { value: 'West campus' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save branch' }));
  await screen.findByRole('button', { name: 'Edit West campus' });
  expect(adapter.mock.calls[1][0].url).toBe('/schools/main/branches');
  expect(JSON.parse(adapter.mock.calls[1][0].data)).toEqual({ name: 'East campus' });
  expect(adapter.mock.calls[2][0].url).toBe('/schools/main/branches/branch');
});
