export function calculateGrade(mark, bands) {
  const band = bands.find((item) => mark >= Number(item.minMark) && mark <= Number(item.maxMark));
  return band
    ? { grade: band.label, gradePoint: Number(band.point) }
    : { grade: null, gradePoint: null };
}

export function calculateResult({ marks, bands, passMark }) {
  const total = marks.reduce((sum, item) => sum + Number(item.score), 0);
  const average = marks.length ? total / marks.length : 0;
  const grade = calculateGrade(average, bands);
  const passed = marks.length > 0 && marks.every((item) => Number(item.score) >= Number(passMark));
  return { total, average, ...grade, studentStatus: passed ? 'PASS' : 'FAIL' };
}

export function rankResults(results) {
  return [...results]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .map((item, index) => ({ ...item, position: index + 1 }));
}

export function nextResultStatus(status, next) {
  const allowed = {
    DRAFT: ['PROCESSING'],
    PROCESSING: ['REVIEW'],
    REVIEW: ['APPROVED'],
    APPROVED: ['PUBLISHED'],
    PUBLISHED: ['LOCKED'],
    LOCKED: [],
  };
  if (!allowed[status]?.includes(next))
    throw new Error(`Invalid result transition: ${status} -> ${next}`);
  return next;
}
