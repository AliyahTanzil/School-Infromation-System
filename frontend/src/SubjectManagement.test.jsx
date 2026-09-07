import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import api from './api/auth.js';
import SubjectManagement from './SubjectManagement.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  api.post.mockResolvedValue({ data: { data: {} } });
  api.get.mockImplementation(async (url) => {
    if (url === '/subjects') return { data: { data: [] } };
    if (url === '/classes') {
      return {
        data: {
          data: {
            items: [
              {
                id: 'class-1',
                name: 'Grade 7',
                section: 'A',
                gradeLevel: { name: 'Junior secondary' },
                academicYear: { name: '2026' },
              },
            ],
          },
        },
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
});

afterEach(cleanup);

describe('Subject management', () => {
  it('requires a class and sends its class-specific teaching focus', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SubjectManagement />
      </MemoryRouter>
    );
    const createButton = await screen.findByRole('button', { name: 'Create subject' });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Subject name' }), 'Mathematics');
    await user.click(screen.getByRole('checkbox', { name: /Grade 7/ }));
    await user.type(
      screen.getByRole('textbox', { name: 'Teaching focus for Grade 7' }),
      'Foundational algebra'
    );
    await user.click(createButton);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/subjects',
        expect.objectContaining({
          name: 'Mathematics',
          classAssignments: [{ classId: 'class-1', teachingFocus: 'Foundational algebra' }],
        })
      )
    );
  });
});
