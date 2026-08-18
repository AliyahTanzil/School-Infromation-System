import type { AttendanceMutation, AttendanceStatus } from './contracts';

const queue: AttendanceMutation[] = [];
export function enqueueAttendance(sessionId: string, records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>): AttendanceMutation {
  const operation: AttendanceMutation = { localOperationId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, sessionId, records, createdAt: new Date().toISOString(), syncStatus: 'PENDING_SYNC', retryCount: 0 };
  queue.push(operation);
  return operation;
}
export function pendingAttendance() { return queue.filter((item) => item.syncStatus !== 'SYNCED'); }
export function markAttendanceSync(id: string, status: AttendanceMutation['syncStatus'], error?: string) { const item = queue.find((entry) => entry.localOperationId === id); if (item) { item.syncStatus = status; item.error = error; if (status === 'FAILED') item.retryCount += 1; } return item; }
export function clearSyncedAttendance() { for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index].syncStatus === 'SYNCED') queue.splice(index, 1); }
