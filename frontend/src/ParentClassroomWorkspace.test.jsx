import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api/auth.js';
import ParentClassroomWorkspace from './ParentClassroomWorkspace.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn() } }));

const children = ['Ada', 'Ben'].map((name, index) => ({
  relationship: 'Parent',
  permissions: { academic: true },
  student: {
    id: `student-${index}`,
    profile: { firstName: name, lastName: 'Okoro' },
    admissionNumber: `S${index}`,
    status: 'ACTIVE',
  },
}));

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(async (url) => {
    if (url === '/parents/me') return { data: { data: { children } } };
    if (url === '/lms/classrooms') {
      return { data: { data: [{ id: 'room-1', code: 'MATH', name: 'Mathematics' }] } };
    }
    if (url === '/lms/assignments') {
      return {
        data: {
          data: [
            {
              id: 'work-1',
              title: 'Fractions',
              type: 'ASSIGNMENT',
              points: 20,
              status: 'PUBLISHED',
              description: 'Compare the fractions.',
            },
          ],
        },
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
});

afterEach(cleanup);

describe('Parent classroom workspace', () => {
  it('renders loaded classrooms and opens and closes assignment details', async () => {
    const user = userEvent.setup();
    render(<ParentClassroomWorkspace />);
    await user.click(await screen.findByRole('button', { name: /Fractions/ }));
    const dialog = screen.getByRole('dialog', { name: 'Fractions' });
    expect(within(dialog).getByText('Compare the fractions.')).toBeInTheDocument();
    expect(within(dialog).getByText(/20 pts.*No due date/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close assignment' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Classroom directory' })).toBeInTheDocument();
  });

  it('uses the selected linked student on the attendance tab', async () => {
    const user = userEvent.setup();
    render(<ParentClassroomWorkspace />);
    await screen.findByRole('option', { name: 'Ben Okoro (S1)' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Viewing student' }),
      'student-1'
    );
    await user.click(screen.getByRole('button', { name: 'Attendance' }));
    expect(
      screen.getByText('Attendance details for Ben Okoro are not available in this view.')
    ).toBeInTheDocument();
    expect(api.get.mock.calls.filter(([url]) => url === '/parents/me')).toHaveLength(1);
  });

  it('handles an account without linked students', async () => {
    api.get.mockResolvedValue({ data: { data: { children: [] } } });
    const user = userEvent.setup();
    render(<ParentClassroomWorkspace />);
    expect(await screen.findByText('No linked students found.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Attendance' }));
    expect(
      screen.getByText('Select a linked student to view attendance information.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
