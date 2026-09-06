import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SchoolAdmin from './SchoolAdmin.jsx';
import { MemoryRouter } from 'react-router-dom';
import api, { setAccessToken } from './api/auth.js';

const originalAdapter = api.defaults.adapter;
describe('School management', () => {
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it('loads and creates schools with the signed-in access token', async () => {
    const school = {
      id: 'school-1',
      name: 'North Academy',
      slug: 'north-academy',
      email: 'admin@north.edu',
    };
    const responses = [{ items: [], total: 0 }, school, { items: [school], total: 1 }];
    const adapter = vi.fn(async (config) => ({
      data: { data: responses.shift() },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;
    setAccessToken('test-access-token');
    render(
      <MemoryRouter>
        <SchoolAdmin />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Back to administration' })).toHaveAttribute(
      'href',
      '/admin'
    );
    expect(await screen.findByText('No schools yet')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('School name'), { target: { value: 'North Academy' } });
    expect(screen.getByLabelText('Slug')).toHaveValue('north-academy');
    expect(screen.getByLabelText('Contact email')).toHaveValue('north-academy@gmail.com');
    fireEvent.change(screen.getByLabelText('Contact email'), {
      target: { value: 'admin@north.edu' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create school' }).at(-1));
    await screen.findByText('School created successfully.');
    await waitFor(() => expect(adapter).toHaveBeenCalledTimes(3));
    for (const [config] of adapter.mock.calls) {
      expect(config.url).toBe('/schools');
      expect(config.headers.get('Authorization')).toBe('Bearer test-access-token');
      expect(config.withCredentials).toBe(true);
    }
    expect(adapter.mock.calls[1][0].method).toBe('post');
    expect(JSON.parse(adapter.mock.calls[1][0].data)).toEqual({
      name: school.name,
      slug: school.slug,
      email: school.email,
    });
  });

  it('shows backend error messages when school loading fails', async () => {
    api.defaults.adapter = async () => {
      throw { response: { status: 403, data: { error: { message: 'Insufficient permissions' } } } };
    };
    render(
      <MemoryRouter>
        <SchoolAdmin />
      </MemoryRouter>
    );
    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('No schools yet')).not.toBeInTheDocument();
    expect(screen.queryByText('0 schools configured')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry loading schools' })).toBeInTheDocument();
  });
});
