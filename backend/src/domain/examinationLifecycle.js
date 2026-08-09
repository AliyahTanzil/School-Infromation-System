const ExaminationStatus = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  MARKING: 'MARKING',
  MODERATION: 'MODERATION',
  APPROVAL: 'APPROVAL',
  LOCKED: 'LOCKED',
  ARCHIVED: 'ARCHIVED',
});
const MarkStatus = Object.freeze({ APPROVED: 'APPROVED', LOCKED: 'LOCKED' });

const transitions = {
  [ExaminationStatus.DRAFT]: [ExaminationStatus.SCHEDULED, ExaminationStatus.ARCHIVED],
  [ExaminationStatus.SCHEDULED]: [ExaminationStatus.IN_PROGRESS, ExaminationStatus.DRAFT],
  [ExaminationStatus.IN_PROGRESS]: [ExaminationStatus.MARKING],
  [ExaminationStatus.MARKING]: [ExaminationStatus.MODERATION],
  [ExaminationStatus.MODERATION]: [ExaminationStatus.APPROVAL],
  [ExaminationStatus.APPROVAL]: [ExaminationStatus.LOCKED],
  [ExaminationStatus.LOCKED]: [ExaminationStatus.ARCHIVED],
  [ExaminationStatus.ARCHIVED]: [],
};

export function assertExaminationTransition(from, to) {
  if (!transitions[from]?.includes(to))
    throw new Error(`Invalid examination transition: ${from} -> ${to}`);
}

export function assertMarkWritable(examStatus, markStatus) {
  if ([ExaminationStatus.LOCKED, ExaminationStatus.ARCHIVED].includes(examStatus))
    throw new Error('Examination is locked');
  if ([MarkStatus.APPROVED, MarkStatus.LOCKED].includes(markStatus))
    throw new Error('Mark is immutable');
}

export function assertScore(score, maxScore) {
  const value = Number(score);
  const max = Number(maxScore);
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value < 0 || value > max)
    throw new Error('Score must be between zero and max score');
}
