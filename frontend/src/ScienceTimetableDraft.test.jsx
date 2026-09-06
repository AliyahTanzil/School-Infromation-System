import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScienceTimetableDraft from './ScienceTimetableDraft.jsx';
import { scienceWeek, scienceSubjects } from './scienceTimetableDraft.js';
describe('SSS Science 3A draft', () => {
  it('has five days, nine subjects and 40 periods with six for each core subject', () => {
    expect(scienceWeek).toHaveLength(5);
    expect(scienceWeek.every((day) => day.length === 8)).toBe(true);
    expect(new Set(scienceWeek.flat()).size).toBe(9);
    for (let index = 0; index < 5; index += 1) {
      expect(scienceWeek.flat().filter((item) => item === index)).toHaveLength(6);
      expect(scienceWeek.every((day) => day.includes(index))).toBe(true);
    }
    expect(scienceSubjects).toHaveLength(9);
  });
  it('labels the preview unsaved and updates provisional subject names in the grid', () => {
    render(<ScienceTimetableDraft />);
    expect(screen.getByText(/Not saved/)).toBeInTheDocument();
    expect(screen.getByText('12:00–12:40')).toBeInTheDocument();
    expect(screen.queryByText('Break')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Additional subject 1'), {
      target: { value: 'Further Mathematics' },
    });
    expect(screen.getAllByText('Further Mathematics')).toHaveLength(3);
  });
});
