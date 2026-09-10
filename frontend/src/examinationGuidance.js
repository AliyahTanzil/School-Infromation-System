export function examinationNextTask(exam) {
  if (exam.status === 'ARCHIVED')
    return 'Archived cycle. Review its records; use a new cycle for future examinations.';
  if (exam.status === 'LOCKED')
    return 'Marks are locked. Continue to result processing with an active grading policy.';
  if (exam.status === 'DRAFT') {
    if (
      !exam._count ||
      !Number.isFinite(exam._count.candidates) ||
      !Number.isFinite(exam._count.schedules)
    )
      return 'Refresh the examination records to check candidates and subject schedules.';
    if (!exam._count.candidates)
      return 'Register candidates from the students actively enrolled in each class.';
    if (!exam._count.schedules)
      return 'Add subject schedules for the candidate classes, including examination dates and times.';
    return 'Review the full candidate register and subject schedule before scheduling this cycle.';
  }
  return (
    {
      SCHEDULED: 'Confirm candidates and subject dates, then start the examination when due.',
      IN_PROGRESS: 'Conduct the scheduled examinations, then move the cycle to marking.',
      MARKING: 'Enter and check every required mark before sending the cycle for moderation.',
      MODERATION: 'Review and moderate marks before submitting them for approval.',
      APPROVAL: 'Approve the reviewed marks, then lock the examination before processing results.',
    }[exam.status] ?? 'Review this examination’s status before continuing.'
  );
}
