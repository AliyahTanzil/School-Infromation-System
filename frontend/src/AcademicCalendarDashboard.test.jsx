import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from './api/auth.js';
import AcademicCalendarDashboard from './AcademicCalendarDashboard.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

beforeEach(() => {
  api.get.mockResolvedValue({ data: { data: [] } });
  api.post.mockResolvedValue({ data: { data: {} } });
  api.patch.mockResolvedValue({ data: { data: {} } });
});

afterEach(cleanup);

describe('Academic calendar dashboard', () => {
  it('opens the period form and creates an academic year', async () => {
    const user = userEvent.setup();
    render(<AcademicCalendarDashboard />);
    await screen.findByText('No calendar items found.');
    await user.click(screen.getByRole('button', { name: 'Create period' }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '2027 Academic Year');
    await user.type(screen.getByLabelText('Start date'), '2027-01-01');
    await user.type(screen.getByLabelText('End date'), '2027-12-31');
    await user.click(screen.getByRole('button', { name: 'Create year' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/academic-periods',
        expect.objectContaining({ name: '2027 Academic Year', type: 'YEAR' })
      )
    );
  });

  it('creates a persisted school event through the event endpoint', async () => {
    const user = userEvent.setup();
    render(<AcademicCalendarDashboard />);
    await screen.findByText('No calendar items found.');
    await user.click(screen.getByRole('button', { name: 'Create period' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'EVENT');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Founders Day');
    await user.type(screen.getByRole('textbox', { name: 'Code' }), 'FOUNDERS-27');
    await user.type(screen.getByLabelText('Start date'), '2027-02-10');
    await user.type(screen.getByLabelText('End date'), '2027-02-10');
    await user.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/academic-periods/events',
        expect.objectContaining({ type: 'EVENT', code: 'FOUNDERS-27' })
      )
    );
  });
});
