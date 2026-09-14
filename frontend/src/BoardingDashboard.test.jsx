import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import BoardingDashboard from './BoardingDashboard.jsx';
import api from './api/auth.js';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});

it('waits for school recovery and ignores a school cached by a previous session', async () => {
  sessionStorage.setItem('schoolId', 'previous-school');
  api.get.mockRejectedValueOnce(new Error('Unavailable'));
  render(
    <MemoryRouter>
      <BoardingDashboard />
    </MemoryRouter>
  );
  expect(await screen.findByText('Unable to load')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByPlaceholderText('School UUID')).not.toBeInTheDocument();

  api.get.mockImplementation(async (path) => ({
    data: { data: path === '/school' ? { school: { id: 'current-school' } } : [] },
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith('/boarding/overview', {
      headers: { 'x-school-id': 'current-school' },
    })
  );
  expect(screen.queryByPlaceholderText('School UUID')).not.toBeInTheDocument();
});

it('keeps boarding operations unavailable until a school has been configured', async () => {
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  render(
    <MemoryRouter>
      <BoardingDashboard />
    </MemoryRouter>
  );
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});
