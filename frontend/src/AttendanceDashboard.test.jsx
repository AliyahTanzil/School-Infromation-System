import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import api from './api/auth.js';
import AttendanceDashboard from './AttendanceDashboard.jsx';

vi.mock('./api/auth.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => {
  api.get.mockImplementation(async (url) => {
    if (url === '/attendance') return { data: { items: [] } };
    if (url === '/attendance/options') {
      return {
        data: {
          classes: [
            {
              id: 'class-1',
              name: 'Blue class',
              section: 'A',
              academicYear: { name: '2026' },
            },
          ],
        },
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  api.post.mockResolvedValue({ data: {} });
  api.patch.mockResolvedValue({ data: {} });
});

afterEach(cleanup);

it('creates attendance from an assigned class selector without manual school or class IDs', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AttendanceDashboard />
    </MemoryRouter>
  );

  const classSelector = await screen.findByRole('combobox', { name: 'Class' });
  expect(screen.queryByPlaceholderText(/UUID/i)).not.toBeInTheDocument();
  await user.selectOptions(classSelector, 'class-1');
  await user.type(screen.getByRole('textbox', { name: 'Register title' }), 'Morning register');
  await user.click(screen.getByRole('button', { name: 'Create draft register' }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      '/attendance',
      expect.objectContaining({
        classId: 'class-1',
        title: 'Morning register',
      })
    )
  );
});
