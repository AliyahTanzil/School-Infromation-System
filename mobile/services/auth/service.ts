import { apiRequest } from '../api/client';
import { ApiError } from '../api/errors';
import type { MobileSessionContext } from '../../types/auth';
import { secureAuthStorage } from './secureStorage';
import { sessionStore } from '../../store/session';

export type LoginInput = { identifier: string; password: string };
type AuthResponse = { accessToken?: string; token?: string; session?: MobileSessionContext };

async function sessionFromToken(accessToken: string) {
  return apiRequest<MobileSessionContext>('/auth/me', { accessToken });
}

let refreshInFlight: Promise<string | null> | null = null;

export async function login(input: LoginInput) {
  const response = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  const accessToken = response.accessToken ?? response.token;
  if (!accessToken || !response.session) throw new ApiError('The backend returned an incomplete session.', 'server');
  await secureAuthStorage.setAccessToken(accessToken);
  await sessionStore.set(response.session);
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
  try {
    const current = await sessionFromToken(token);
    await sessionStore.set(current);
    return current;
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'authentication') {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        await secureAuthStorage.clear();
        return null;
      }
      const current = await sessionFromToken(refreshed);
      await sessionStore.set(current);
      return current;
    }
    throw error;
  }
}

export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST', accessToken: await secureAuthStorage.getAccessToken() ?? undefined }); }
  finally {
    await secureAuthStorage.clear();
    await sessionStore.clear();
  }
}
