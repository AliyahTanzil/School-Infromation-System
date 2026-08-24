import { appConfig } from '../../config/env';
import { ApiError, classifyApiError } from './errors';

export type RequestOptions = RequestInit & { accessToken?: string };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (options.accessToken) headers.set('Authorization', `Bearer ${options.accessToken}`);

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, { ...options, headers, signal: controller.signal });
    const requestId = response.headers.get('x-request-id') ?? undefined;
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new ApiError(payload?.message ?? 'The SAIS API request failed.', classifyApiError(response.status), response.status, requestId, payload);
    }
    return (payload?.data ?? payload) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error && error.name === 'AbortError' ? 'The request timed out.' : 'The SAIS API is unavailable.', 'network');
  } finally {
    clearTimeout(timeout);
  }
}
