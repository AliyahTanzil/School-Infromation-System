import React from 'react';
import { AttendanceWorkflow } from '../components/attendance/AttendanceWorkflow';
import type { AttendanceRecord } from '../services/attendance/contracts';

const demoRecords: AttendanceRecord[] = [
  { id: '1', studentId: 'student-1', studentName: 'Cached student list', status: 'ABSENT' },
  { id: '2', studentId: 'student-2', studentName: 'Synchronized student list', status: 'ABSENT' },
];
export default function AttendanceScreen() { return <AttendanceWorkflow sessionId="cached-session" title="Today’s attendance" records={demoRecords} />; }
