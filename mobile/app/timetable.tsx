import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import type { TimetableEntry } from '../services/timetable/contracts';
const entries: TimetableEntry[] = [{ id: 'period-1', subjectName: 'Today’s confirmed schedule', startsAt: '08:00', endsAt: '09:00', status: 'PUBLISHED' }];
export default function TimetableScreen() { return <ScrollView contentContainerStyle={styles.container}><Text accessibilityRole="header" style={styles.title}>Today’s schedule</Text><Text style={styles.subtitle}>Only published timetable data is shown. Draft schedules remain hidden.</Text>{entries.map((entry) => <View key={entry.id} style={styles.card}><Text style={styles.time}>{entry.startsAt}–{entry.endsAt}</Text><Text style={styles.subject}>{entry.subjectName}</Text><Text style={styles.meta}>{entry.status}</Text></View>)}</ScrollView>; }
const styles = StyleSheet.create({ container: { padding: spacing.lg, gap: spacing.md }, title: { fontSize: 24, fontWeight: '800', color: colors.ink }, subtitle: { color: colors.muted, lineHeight: 22 }, card: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: spacing.md, gap: 6 }, time: { color: colors.blue, fontWeight: '800' }, subject: { color: colors.ink, fontSize: 18, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 12 } });
