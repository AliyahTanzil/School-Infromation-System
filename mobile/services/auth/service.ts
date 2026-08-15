import { apiRequest } from '../api/client';
import { ApiError } from '../api/errors';
import type { MobileSessionContext } from '../../types/auth';
import { secureAuthStorage } from './secureStorage';

export type LoginInput = { identifier: string; password: string };
type AuthResponse = { accessToken?: string; token?: string; session?: MobileSessionContext };

let refreshInFlight: Promise<string | null> | null = null;

export async function login(input: LoginInput) {
  const response = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  const accessToken = response.accessToken ?? response.token;
  if (!accessToken || !response.session) throw new ApiError('The backend returned an incomplete session.', 'server');
  await secureAuthStorage.setAccessToken(accessToken);
  return response.session;
}

export async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then(async (response) => {
        const token = response.accessToken ?? response.token;
        if (token) await secureAuthStorage.setAccessToken(token);
        return token ?? null;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function restoreSession() {
  const token = await secureAuthStorage.getAccessToken();
  if (!token) return null;
  return token;
}

export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST', accessToken: await secureAuthStorage.getAccessToken() ?? undefined }); }
  finally { await secureAuthStorage.clear(); }
}
