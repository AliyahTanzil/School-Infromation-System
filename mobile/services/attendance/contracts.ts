export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
export type AttendanceSessionStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'ARCHIVED';
export type AttendanceRecord = { id: string; studentId: string; studentName: string; status: AttendanceStatus; note?: string };
export type AttendanceSession = { id: string; classId: string; title: string; sessionDate: string; status: AttendanceSessionStatus; records?: AttendanceRecord[]; summary?: Record<string, number> };
export type AttendanceMutation = { localOperationId: string; sessionId: string; records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>; createdAt: string; syncStatus: 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED'; retryCount: number; error?: string };
export const attendanceStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY'];
export const attendanceEndpoints = { sessions: '/api/v1/attendance', bulk: (id: string) => `/api/v1/attendance/${id}/records/bulk` } as const;
