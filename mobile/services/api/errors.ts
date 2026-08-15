export type ApiErrorKind = 'validation' | 'authentication' | 'authorization' | 'network' | 'server' | 'unknown';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function classifyApiError(status: number): ApiErrorKind {
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status >= 400 && status < 500) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
