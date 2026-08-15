export type QueryStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error' | 'offline';
export type QueryState<T> = { status: QueryStatus; data?: T; error?: string; updatedAt?: number };

export function cachedQuery<T>(data: T, updatedAt = Date.now()): QueryState<T> {
  return { status: 'success', data, updatedAt };
}

export function offlineQuery<T>(data?: T, updatedAt?: number): QueryState<T> {
  return { status: 'offline', data, updatedAt };
}
