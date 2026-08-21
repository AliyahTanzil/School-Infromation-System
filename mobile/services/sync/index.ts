import NetInfo from '@react-native-community/netinfo';
import { hydrateAttendanceQueue, pendingAttendance, markAttendanceSync, clearSyncedAttendance } from '../attendance/queue';
import { saveAttendance } from '../attendance/service';

export type SyncState = 'online' | 'offline' | 'syncing' | 'error';
export type SyncSnapshot = { state: SyncState; lastSyncedAt: string | null; pendingCount: number };

let current: SyncSnapshot = { state: 'offline', lastSyncedAt: null, pendingCount: 0 };
let unsubscribe: (() => void) | null = null;

export async function syncPendingAttendance() {
  await hydrateAttendanceQueue();
  const pending = pendingAttendance().filter((item) => item.syncStatus !== 'SYNCED');
  current = { ...current, state: pending.length ? 'syncing' : 'online', pendingCount: pending.length };
  for (const item of pending) {
    try {
      markAttendanceSync(item.localOperationId, 'SYNCING');
      await saveAttendance(item.sessionId, item.records);
      markAttendanceSync(item.localOperationId, 'SYNCED');
    } catch (error) {
      markAttendanceSync(item.localOperationId, 'FAILED', error instanceof Error ? error.message : 'Sync failed');
    }
  }
  clearSyncedAttendance();
  current = { state: 'online', lastSyncedAt: new Date().toISOString(), pendingCount: pendingAttendance().length };
  return current;
}

export async function startSync() {
  await hydrateAttendanceQueue();
  unsubscribe?.();
  unsubscribe = NetInfo.addEventListener((state) => {
    current = { ...current, state: state.isConnected ? 'online' : 'offline', pendingCount: pendingAttendance().length };
    if (state.isConnected) void syncPendingAttendance();
  });
  const state = await NetInfo.fetch();
  if (state.isConnected) await syncPendingAttendance();
  return current;
}

export function stopSync() { unsubscribe?.(); unsubscribe = null; }
export const syncFoundation = { snapshot: (): SyncSnapshot => current, start: startSync, stop: stopSync, sync: syncPendingAttendance };
