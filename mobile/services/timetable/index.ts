import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import { timetableEndpoint, type Timetable } from './contracts';

export async function listTimetables() {
  return apiRequest<Timetable[]>(timetableEndpoint, { accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined });
}
