import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import api from './api/auth.js';
import ClassDetailDashboard from './ClassDetailDashboard.jsx';

vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const klass = {
  id: 'class-1',
  name: 'Grade 7',
  section: 'A',
  code: 'G7A',
  capacity: 30,
  status: 'ACTIVE',
  school: { name: 'Central School' },
  gradeLevel: { name: 'Grade 7' },
  academicYear: { name: '2026' },
  enrollments: [],
  subjects: [],
};

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.patch.mockReset();
  api.post.mockResolvedValue({ data: { data: {} } });
  api.get.mockImplementation(async (url) => {
    if (url === '/classes/class-1') return { data: { data: klass } };
    if (url === '/students') {
      return {
        data: {
          data: {
            items: [
              {
                id: 'student-1',
                admissionNumber: 'S001',
                profile: { firstName: 'Ada', lastName: 'Cole' },
              },
            ],
          },
        },
      };
    }
    if (url === '/subjects')
      return { data: { data: [{ id: 'subject-1', name: 'Math', code: 'MTH' }] } };
    throw new Error(`Unexpected request: ${url}`);
  });
});

afterEach(cleanup);

describe('Class detail dashboard', () => {
  function showClass() {
    return render(
      <MemoryRouter initialEntries={['/classes/class-1']}>
        <Routes>
          <Route path="/classes/:classId" element={<ClassDetailDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('guides a planned class through activation, enrollment, subjects, and timetables', async () => {
    const user = userEvent.setup();
    let record = { ...klass, status: 'PLANNED' };
    const originalGet = api.get.getMockImplementation();
    api.get.mockImplementation((url, options) =>
      url === '/classes/class-1'
        ? Promise.resolve({ data: { data: record } })
        : originalGet(url, options)
    );
    api.patch.mockImplementation(async () => {
      record = { ...record, status: 'ACTIVE' };
      return { data: {} };
    });
    api.post.mockImplementation(async (url) => {
      record = url.endsWith('/enrollments')
        ? {
            ...record,
            enrollments: [
              {
                studentId: 'student-1',
                student: { id: 'student-1', profile: { firstName: 'Ada' } },
              },
            ],
          }
        : {
            ...record,
            subjects: [{ subjectId: 'subject-1', subject: { id: 'subject-1', name: 'Math' } }],
          };
      return { data: {} };
    });
    showClass();
    expect(await screen.findByRole('link', { name: 'Next: Activate the class' })).toHaveAttribute(
      'href',
      '#class-activation'
    );
    expect(screen.getByRole('button', { name: 'Add student' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Activate class' }));
    expect(await screen.findByRole('link', { name: 'Next: Enroll students' })).toHaveAttribute(
      'href',
      '#class-students'
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Student' }), 'student-1');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    expect(await screen.findByRole('link', { name: 'Next: Attach subjects' })).toHaveAttribute(
      'href',
      '#class-subjects'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Existing subject' }),
      'subject-1'
    );
    await user.click(screen.getByRole('button', { name: 'Attach subject' }));
    expect(
      await screen.findByRole('link', { name: 'Continue to timetable setup' })
    ).toHaveAttribute('href', '/timetables');
    expect(screen.getByText(/Review the full student roster/)).toBeInTheDocument();
  });

  it('offers student creation when no active students are available', async () => {
    const originalGet = api.get.getMockImplementation();
    api.get.mockImplementation((url, options) =>
      url === '/students'
        ? Promise.resolve({ data: { data: { items: [] } } })
        : originalGet(url, options)
    );
    showClass();
    expect(
      await screen.findByRole('link', { name: 'Create or activate students' })
    ).toHaveAttribute('href', '/students');
  });

  it('does not claim setup progress when records cannot be loaded', async () => {
    api.get.mockRejectedValue(new Error('Unavailable'));
    showClass();
    await screen.findByRole('alert');
    expect(screen.queryByRole('heading', { name: 'Set up this class' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Continue to timetable setup' })
    ).not.toBeInTheDocument();
  });

  it('enrolls a school student and attaches a school subject', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/classes/class-1']}>
        <Routes>
          <Route path="/classes/:classId" element={<ClassDetailDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Grade 7 · A' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Student' }), 'student-1');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/classes/class-1/enrollments', {
        studentId: 'student-1',
      })
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Existing subject' }),
      'subject-1'
    );
    await user.click(screen.getByRole('button', { name: 'Attach subject' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/classes/class-1/subjects', { subjectId: 'subject-1' })
    );
  });
});
