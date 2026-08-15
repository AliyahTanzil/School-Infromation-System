// Backend-authoritative examination lifecycle and mark contracts.
export type ExaminationStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'MARKING'
  | 'MODERATION'
  | 'APPROVAL'
  | 'LOCKED'
  | 'ARCHIVED';

export type MarkStatus = 'DRAFT' | 'APPROVED' | 'LOCKED';

export type Examination = {
  id: string;
  name: string;
  status: ExaminationStatus;
  period?: { id: string; name: string; startsOn: string; endsOn: string };
  candidatesCount?: number;
  schedulesCount?: number;
  marksCount?: number;
};

export type ExaminationMark = {
  id?: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  score: number | null;
  maxScore: number;
  status?: MarkStatus;
};

export const examinationStatuses: ExaminationStatus[] = [
  'DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'MARKING', 'MODERATION', 'APPROVAL', 'LOCKED', 'ARCHIVED',
];

export function validateScore(score: number | null, maxScore: number) {
  if (score === null) return 'Score is required';
  if (!Number.isFinite(score)) return 'Score must be numeric';
  if (maxScore <= 0 || score < 0 || score > maxScore) return 'Score must be between zero and max score';
  return null;
}
