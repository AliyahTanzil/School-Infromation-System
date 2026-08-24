import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import type { Examination, ExaminationMark } from './contracts';

const endpoint = '/api/v1/examinations';
const token = () => secureAuthStorage.getAccessToken();

export async function listExaminations() {
  return apiRequest<Examination[]>(endpoint, { accessToken: (await token()) ?? undefined });
}

export async function listMarks(examinationId: string, subjectCode?: string) {
  const query = subjectCode ? `?subjectCode=${encodeURIComponent(subjectCode)}` : '';
  return apiRequest<ExaminationMark[]>(`${endpoint}/${encodeURIComponent(examinationId)}/marks${query}`, { accessToken: (await token()) ?? undefined });
}

export async function saveMarks(examinationId: string, marks: ExaminationMark[]) {
  if (!examinationId.trim() || marks.length === 0) throw new Error('An examination and marks are required.');
  return apiRequest<{ marks: ExaminationMark[] }>(`${endpoint}/${encodeURIComponent(examinationId)}/marks`, { method: 'POST', accessToken: (await token()) ?? undefined, body: JSON.stringify({ marks }) });
}
