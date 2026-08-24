import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { listTimetables } from '../services/timetable';
import type { TimetableEntry } from '../services/timetable/contracts';

export default function TimetableScreen() {
  const [entries, setEntries] = useState<TimetableEntry[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { listTimetables().then((timetables) => setEntries(timetables.filter((table) => table.status === 'PUBLISHED').flatMap((table) => table.entries))).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load timetable.')); }, []);
  if (error) return <ScrollView contentContainerStyle={styles.container}><Text style={styles.subtitle}>{error}</Text></ScrollView>;
  if (!entries) return <ActivityIndicator accessibilityLabel="Loading timetable" />;
  return <ScrollView contentContainerStyle={styles.container}><Text accessibilityRole="header" style={styles.title}>Today&apos;s schedule</Text><Text style={styles.subtitle}>Only published timetable data is shown. Draft schedules remain hidden.</Text>{entries.map((entry) => <View key={entry.id} style={styles.card}><Text style={styles.time}>{entry.startsAt}–{entry.endsAt}</Text><Text style={styles.subject}>{entry.subjectName ?? entry.className ?? 'Scheduled class'}</Text><Text style={styles.meta}>{entry.status ?? 'PUBLISHED'}</Text></View>)}</ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: spacing.lg, gap: spacing.md }, title: { fontSize: 24, fontWeight: '800', color: colors.ink }, subtitle: { color: colors.muted, lineHeight: 22 }, card: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: spacing.md, gap: 6 }, time: { color: colors.blue, fontWeight: '800' }, subject: { color: colors.ink, fontSize: 18, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 12 } });
