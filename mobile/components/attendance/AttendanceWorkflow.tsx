import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { attendanceStatuses, type AttendanceRecord, type AttendanceStatus } from '../../services/attendance/contracts';
import { enqueueAttendance } from '../../services/attendance/queue';

type Props = { sessionId: string; title: string; records: AttendanceRecord[]; onSaved?: () => void; onSave?: (records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>) => Promise<void> };
export function AttendanceWorkflow({ sessionId, title, records, onSaved, onSave }: Props) {
  const [values, setValues] = useState<Record<string, AttendanceStatus>>(() => Object.fromEntries(records.map((record) => [record.studentId, record.status])));
  const pending = useMemo(() => Object.keys(values).length, [values]);
  const setAll = (status: AttendanceStatus) => setValues(Object.fromEntries(records.map((record) => [record.studentId, status])));
  const saveLocally = async () => {
    const next = records.map((record) => ({ studentId: record.studentId, status: values[record.studentId] }));
    if (onSave) { try { await onSave(next); onSaved?.(); return; } catch { /* retain the offline copy when the API is unavailable */ } }
    enqueueAttendance(sessionId, next);
    onSaved?.();
  };
  return <ScrollView contentContainerStyle={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.notice}>Attendance is saved locally first and remains pending until SAIS confirms synchronization.</Text>
    <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => setAll('PRESENT')} style={styles.primary}><Text style={styles.primaryText}>Mark all present</Text></Pressable><Text style={styles.pending}>Pending: {pending}</Text></View>
    {records.map((record) => <View key={record.studentId} style={styles.row}><Text style={styles.student}>{record.studentName}</Text><View style={styles.statuses}>{attendanceStatuses.map((status) => <Pressable accessibilityRole="button" accessibilityState={{ selected: values[record.studentId] === status }} key={status} onPress={() => setValues((current) => ({ ...current, [record.studentId]: status }))} style={[styles.status, values[record.studentId] === status && styles.selected]}><Text style={styles.statusText}>{status.replace('_', ' ')}</Text></Pressable>)}</View></View>)}
    <Pressable accessibilityRole="button" onPress={saveLocally} style={styles.save}><Text style={styles.saveText}>Save locally · Pending sync</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: spacing.lg, gap: spacing.md }, title: { color: colors.ink, fontSize: 24, fontWeight: '800' }, notice: { color: colors.muted, lineHeight: 22 }, actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primary: { backgroundColor: colors.blue, padding: spacing.md, borderRadius: 12 }, primaryText: { color: colors.paper, fontWeight: '800' }, pending: { color: colors.muted }, row: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.sm }, student: { color: colors.ink, fontWeight: '700' }, statuses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, status: { borderColor: colors.line, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 9 }, selected: { backgroundColor: colors.blue, borderColor: colors.blue }, statusText: { color: colors.ink, fontSize: 11 }, save: { backgroundColor: colors.ink, padding: spacing.md, borderRadius: 12, alignItems: 'center' }, saveText: { color: colors.paper, fontWeight: '800' } });
