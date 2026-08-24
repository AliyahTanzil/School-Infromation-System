import { apiRequest } from '../api/client';
import { ApiError } from '../api/errors';
import type { MobileSessionContext } from '../../types/auth';
import { secureAuthStorage } from './secureStorage';
import { sessionStore } from '../../store/session';

export type LoginInput = { identifier: string; password: string };
type AuthUser = { id: string; tenantId?: string | null; roles?: string[]; status?: string };
type AuthResponse = { user?: AuthUser; accessToken?: string; token?: string; sessionId?: string };

type MeResponse = { user: AuthUser };

function toSession(user: AuthUser, sessionId?: string): MobileSessionContext {
  const role = user.roles?.some((value) => value.toLowerCase().includes('owner')) ? 'owner' : user.roles?.some((value) => value.toLowerCase().includes('admin')) ? 'administrator' : user.roles?.some((value) => value.toLowerCase().includes('teacher') || value.toLowerCase().includes('staff')) ? 'staff' : 'tenant';
  const accountStatus = user.status === 'SUSPENDED' ? 'suspended' : user.status === 'PENDING_VERIFICATION' ? 'pending' : 'active';
  return { userId: user.id, tenantId: user.tenantId ?? null, role, permissions: [], accountStatus, deviceId: sessionId ?? null };
}

async function sessionFromToken(accessToken: string) {
  const response = await apiRequest<MeResponse>('/auth/me', { accessToken });
  return toSession(response.user);
}

let refreshInFlight: Promise<string | null> | null = null;

export async function login(input: LoginInput) {
  const response = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email: input.identifier, password: input.password }) });
  const accessToken = response.accessToken ?? response.token;
  if (!accessToken || !response.user) throw new ApiError('The backend returned an incomplete session.', 'server');
  const session = toSession(response.user, response.sessionId);
  await secureAuthStorage.setAccessToken(accessToken);
  await sessionStore.set(session);
  return session;
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
