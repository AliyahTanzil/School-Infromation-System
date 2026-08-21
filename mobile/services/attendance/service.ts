import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import { attendanceEndpoints, type AttendanceRecord, type AttendanceSession, type AttendanceStatus } from './contracts';

export async function listAttendanceSessions(query: { classId?: string; date?: string } = {}) {
  const search = new URLSearchParams(Object.entries(query).filter(([, value]) => value).map(([key, value]) => [key, value as string])).toString();
  const token = await secureAuthStorage.getAccessToken();
  return apiRequest<AttendanceSession[]>(`${attendanceEndpoints.sessions}${search ? `?${search}` : ''}`, { accessToken: token ?? undefined });
}

export async function getAttendanceSession(sessionId: string) {
  const token = await secureAuthStorage.getAccessToken();
  return apiRequest<AttendanceSession>(`${attendanceEndpoints.sessions}/${encodeURIComponent(sessionId)}`, { accessToken: token ?? undefined });
}

export async function saveAttendance(sessionId: string, records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>) {
  if (!sessionId.trim() || records.length === 0) throw new Error('An attendance session and at least one record are required.');
  const token = await secureAuthStorage.getAccessToken();
  return apiRequest<{ records: AttendanceRecord[] }>(attendanceEndpoints.bulk(encodeURIComponent(sessionId)), { method: 'POST', accessToken: token ?? undefined, body: JSON.stringify({ records }) });
}
