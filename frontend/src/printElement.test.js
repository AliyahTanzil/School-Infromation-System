import { afterEach, describe, expect, it, vi } from 'vitest';
import { printElement } from './printElement.js';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.className = '';
  vi.restoreAllMocks();
});

describe('timetable printing', () => {
  it('creates a print-only copy and removes it after printing', () => {
    document.body.innerHTML = '<main><section id="schedule">Timetable only</section></main>';
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});

    expect(printElement('schedule')).toBe(true);
    expect(print).toHaveBeenCalledOnce();
    expect(document.body.classList.contains('printing-timetable')).toBe(true);
    expect(document.querySelector('#timetable-print-root')).toHaveTextContent('Timetable only');

    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.classList.contains('printing-timetable')).toBe(false);
    expect(document.querySelector('#timetable-print-root')).toBeNull();
  });
});
