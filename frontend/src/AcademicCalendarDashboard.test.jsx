import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from './api/auth.js';
import AcademicCalendarDashboard from './AcademicCalendarDashboard.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { data: [] } });
  api.post.mockResolvedValue({ data: { data: {} } });
  api.patch.mockResolvedValue({ data: { data: {} } });
});

afterEach(cleanup);

describe('Academic calendar dashboard', () => {
  it('explains failed year loading and restores selection after retry without losing the term', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'You do not have permission to perform this action' },
      },
    });
    render(<AcademicCalendarDashboard />);
    await screen.findByRole('alert');
    expect(screen.queryByText('No calendar items found.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create period' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'TERM');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'First Term');
    expect(screen.getByRole('combobox', { name: 'Academic year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create term' })).toBeDisabled();
    api.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'year-1',
            type: 'YEAR',
            name: '2026/27',
            status: 'ACTIVE',
            startsAt: '2026-09-01',
            endsAt: '2027-08-31',
          },
        ],
      },
    });
    await user.click(screen.getByRole('button', { name: 'Retry loading calendar' }));
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Academic year' })).toBeEnabled()
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Academic year' }), 'year-1');
    await user.type(screen.getByLabelText('Start date'), '2026-09-14');
    await user.type(screen.getByLabelText('End date'), '2026-12-18');
    await user.click(screen.getByRole('button', { name: 'Create term' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/academic-periods',
        expect.objectContaining({ name: 'First Term', parentId: 'year-1', type: 'TERM' })
      )
    );
  });

  it('directs users to create a year when loading succeeds with no years', async () => {
    const user = userEvent.setup();
    render(<AcademicCalendarDashboard />);
    await screen.findByText('No calendar items found.');
    await user.click(screen.getByRole('button', { name: 'Create period' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'TERM');
    expect(screen.getByRole('combobox', { name: 'Academic year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create term' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Create an academic year first' }));
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('YEAR');
    expect(screen.getByRole('button', { name: 'Create year' })).toBeEnabled();
  });
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
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('description');
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
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('parentId');
  });
});
