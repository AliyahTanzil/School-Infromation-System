import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SchoolAdmin from './SchoolAdmin.jsx';

describe('School management', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads schools and creates a school through the API', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [], total: 0 } }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'school-1',
            name: 'North Academy',
            slug: 'north-academy',
            email: 'admin@north.edu',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [{ id: 'school-1', name: 'North Academy', slug: 'north-academy' }],
            total: 1,
          },
        }),
      });
    render(<SchoolAdmin />);
    expect(await screen.findByText('No schools yet')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('School name'), { target: { value: 'North Academy' } });
    expect(screen.getByLabelText('Slug')).toHaveValue('north-academy');
    expect(screen.getByLabelText('Contact email')).toHaveValue('north-academy@gmail.com');
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'north-academy' } });
    fireEvent.change(screen.getByLabelText('Contact email'), {
      target: { value: 'admin@north.edu' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create school' }).at(-1));
    await screen.findByText('School created successfully.');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/schools');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'include' });
  });
});
