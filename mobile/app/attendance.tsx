import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { AttendanceWorkflow } from '../components/attendance/AttendanceWorkflow';
import { listAttendanceSessions, saveAttendance } from '../services/attendance/service';
import type { AttendanceSession } from '../services/attendance/contracts';

export default function AttendanceScreen() {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { listAttendanceSessions().then((sessions) => setSession(sessions[0] ?? null)).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load attendance.')); }, []);
  if (error) return <Screen title="Attendance"><Text>{error}</Text></Screen>;
  if (!session) return <Screen title="Attendance"><View><ActivityIndicator /><Text>Loading attendance sessions…</Text></View></Screen>;
  return <AttendanceWorkflow sessionId={session.id} title={session.title} records={session.records ?? []} onSave={async (records) => { await saveAttendance(session.id, records); }} />;
}
