import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { hydrateAttendanceQueue, pendingAttendance, conflictingAttendance, markAttendanceSync, clearSyncedAttendance } from '../attendance/queue';
import { ApiError } from '../api/errors';
import { saveAttendance } from '../attendance/service';

export type SyncState = 'online' | 'offline' | 'syncing' | 'conflict' | 'error';
export type SyncSnapshot = { state: SyncState; lastSyncedAt: string | null; pendingCount: number };

let current: SyncSnapshot = { state: 'offline', lastSyncedAt: null, pendingCount: 0 };
let unsubscribe: (() => void) | null = null;
const listeners = new Set<(snapshot: SyncSnapshot) => void>();
function publish(next: SyncSnapshot) { current = next; listeners.forEach((listener) => listener(current)); }
export function subscribeSync(listener: (snapshot: SyncSnapshot) => void) { listeners.add(listener); listener(current); return () => listeners.delete(listener); }

export async function syncPendingAttendance() {
  await hydrateAttendanceQueue();
  const pending = pendingAttendance().filter((item) => item.syncStatus !== 'SYNCED');
  publish({ ...current, state: pending.length ? 'syncing' : 'online', pendingCount: pending.length });
  let failed = false;
  for (const item of pending) {
    try {
      markAttendanceSync(item.localOperationId, 'SYNCING');
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await saveAttendance(item.sessionId, item.records);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        }
      }
      if (lastError) throw lastError;
      markAttendanceSync(item.localOperationId, 'SYNCED');
    } catch (error) {
      failed = true;
      const conflict = error instanceof ApiError && error.kind === 'conflict';
      markAttendanceSync(item.localOperationId, conflict ? 'CONFLICT' : 'FAILED', error instanceof Error ? error.message : 'Sync failed');
    }
  }
  clearSyncedAttendance();
  publish({ state: conflictingAttendance().length ? 'conflict' : failed ? 'error' : 'online', lastSyncedAt: failed ? current.lastSyncedAt : new Date().toISOString(), pendingCount: pendingAttendance().length + conflictingAttendance().length });
  return current;
}

export async function startSync() {
  await hydrateAttendanceQueue();
  unsubscribe?.();
  unsubscribe = NetInfo.addEventListener((state) => {
    publish({ ...current, state: state.isConnected ? 'online' : 'offline', pendingCount: pendingAttendance().length + conflictingAttendance().length });
    if (state.isConnected) void syncPendingAttendance();
  });
  const state = await NetInfo.fetch();
  if (state.isConnected) await syncPendingAttendance();
  return current;
}

export function stopSync() { unsubscribe?.(); unsubscribe = null; }
export function useSyncSnapshot() { return useSyncExternalStore(subscribeSync, () => current, () => current); }
export const syncFoundation = { snapshot: (): SyncSnapshot => current, start: startSync, stop: stopSync, sync: syncPendingAttendance };
