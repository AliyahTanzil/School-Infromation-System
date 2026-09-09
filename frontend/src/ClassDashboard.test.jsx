import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import api from './api/auth.js';
import ClassDashboard from './ClassDashboard.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  api.get.mockResolvedValue({ data: { data: { items: [] } } });
  api.post.mockResolvedValue({ data: { data: {} } });
});

afterEach(cleanup);

it('creates a class with a year and one of the four canonical school stages', async () => {
  const user = userEvent.setup();
  const selectedYear = new Date().getFullYear() + 1;
  render(
    <MemoryRouter>
      <ClassDashboard />
    </MemoryRouter>
  );

  expect(await screen.findByRole('option', { name: 'Pre-School Nursery' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Primary School' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Junior Secondary' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Senior Secondary' })).toBeInTheDocument();

  await user.type(screen.getByRole('textbox', { name: 'name' }), 'Blue class');
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Academic year' }),
    String(selectedYear)
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Grade level' }),
    'JUNIOR_SECONDARY'
  );
  await user.click(screen.getByRole('button', { name: 'Create planned class' }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      '/classes',
      expect.objectContaining({
        name: 'Blue class',
        academicYear: selectedYear,
        gradeLevelCode: 'JUNIOR_SECONDARY',
        capacity: 30,
      })
    )
  );
  expect(api.get).not.toHaveBeenCalledWith('/classes/options');
});
