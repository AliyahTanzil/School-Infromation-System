import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TimetableEntryEditor from './TimetableEntryEditor.jsx';
import api from './api/auth.js';
vi.mock('./api/auth.js', () => ({ default: { post: vi.fn(), patch: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const slot = { id: 'slot', weekday: 1, startTime: '08:00', endTime: '08:40' };
const entry = {
  id: 'entry',
  timeSlotId: 'slot',
  classId: 'class',
  subjectId: 'subject',
  subjectCode: 'MATH',
  duration: 1,
  kind: 'LESSON',
  class: { name: 'Class A' },
};
const options = {
  classes: [{ id: 'class', name: 'Class A' }],
  subjects: [{ id: 'subject', name: 'Math', code: 'MATH' }],
  teachers: [],
};
const table = { id: 'table', status: 'DRAFT', slots: [slot], entries: [entry] };
it('edits an existing lesson and refreshes after the server saves', async () => {
  api.patch.mockResolvedValue({});
  const refresh = vi.fn();
  render(<TimetableEntryEditor timetable={table} options={options} rooms={[]} onSaved={refresh} />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit lesson' }));
  fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Revision class' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save lesson changes' }));
  await screen.findByText('Lesson saved.');
  expect(api.patch).toHaveBeenCalledWith(
    '/timetables/table/entries/entry',
    expect.objectContaining({
      notes: 'Revision class',
      subjectId: 'subject',
      classId: 'class',
      timeSlotId: 'slot',
    })
  );
  expect(refresh).toHaveBeenCalledOnce();
});
it('adds a lesson using named selections and preserves errors for correction', async () => {
  api.post.mockRejectedValue(new Error('Teacher unavailable'));
  render(
    <TimetableEntryEditor
      timetable={{ ...table, entries: [] }}
      options={options}
      rooms={[]}
      onSaved={vi.fn()}
    />
  );
  for (const [label, value] of [
    ['Class', 'class'],
    ['Subject', 'subject'],
    ['Starting period', 'slot'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Add lesson' }));
  await screen.findByText('Teacher unavailable');
  expect(screen.getByLabelText('Subject')).toHaveValue('subject');
  expect(api.post).toHaveBeenCalledWith(
    '/timetables/table/entries',
    expect.objectContaining({ subjectCode: 'MATH', duration: 1 })
  );
});
it('published lessons have no editing controls', () => {
  render(
    <TimetableEntryEditor
      timetable={{ ...table, status: 'PUBLISHED' }}
      options={options}
      rooms={[]}
      onSaved={vi.fn()}
    />
  );
  expect(screen.queryByRole('button', { name: 'Edit lesson' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add lesson' })).not.toBeInTheDocument();
});
