export type SyncState = 'online' | 'offline' | 'syncing' | 'error';

export type SyncSnapshot = { state: SyncState; lastSyncedAt: string | null; pendingCount: number };

export const syncFoundation = {
  snapshot: (): SyncSnapshot => ({ state: 'online', lastSyncedAt: null, pendingCount: 0 }),
};
