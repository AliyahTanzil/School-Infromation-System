import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import TimetableDashboard from './TimetableDashboard.jsx';
import api from './api/auth.js';
vi.mock('./api/auth.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('./ScienceTimetableDraft.jsx', () => ({ default: () => null }));
vi.mock('./WeeklyTimetableGrid.jsx', () => ({ default: () => null }));
vi.mock('./TimetableReadinessPanel.jsx', () => ({ default: () => null }));
vi.mock('./TimetableEntryEditor.jsx', () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  sessionStorage.clear();
});
const show = () =>
  render(
    <MemoryRouter>
      <TimetableDashboard />
    </MemoryRouter>
  );
it('does not load timetable data when no school is configured', async () => {
  sessionStorage.setItem('schoolId', 'foreign-school');
  api.get.mockResolvedValue({ data: { data: { school: null } } });
  show();
  expect(await screen.findByText('School setup required')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});
it('loads timetable and staffing data and changes status without school overrides', async () => {
  sessionStorage.setItem('schoolId', 'foreign-school');
  api.get.mockImplementation(async (path) => ({
    data: {
      data:
        path === '/school'
          ? { school: { id: 'school-1' } }
          : path === '/timetables'
            ? [{ id: 'draft-1', name: 'Draft', status: 'DRAFT', entries: [], slots: [] }]
            : path === '/timetables/options'
              ? { academicYears: [], academicPeriods: [], teachers: [], subjects: [], classes: [] }
              : path.endsWith('/readiness')
                ? {}
                : [],
    },
  }));
  api.patch.mockResolvedValue({ data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Send to review' }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith('/timetables/draft-1/status', { status: 'REVIEW' })
  );
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/timetables/teaching-assignments'));
  expect(api.get).toHaveBeenCalledWith('/timetables/draft-1/readiness');
  for (const [path, config] of api.get.mock.calls)
    if (path !== '/school') expect(config).toBeUndefined();
  expect(sessionStorage.getItem('schoolId')).toBe('foreign-school');
});
