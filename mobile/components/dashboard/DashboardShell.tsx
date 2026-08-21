import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import { Screen } from '../ui/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { ProfileImagePicker } from '../profile/ProfileImagePicker';

export type DashboardRole = 'owner' | 'tenant' | 'administrator' | 'staff';
const data: Record<DashboardRole, { eyebrow: string; title: string; summary: string; cards: string[] }> = {
  owner: { eyebrow: 'Owner workspace', title: 'Platform overview', summary: 'Monitor tenant health, security, and platform operations.', cards: ['Tenant provisioning', 'Security posture', 'System activity'] },
  tenant: { eyebrow: 'Tenant workspace', title: 'School operations', summary: 'Keep your school community aligned and informed.', cards: ['Today at a glance', 'Attendance pulse', 'Announcements'] },
  administrator: { eyebrow: 'Administrator workspace', title: 'Daily administration', summary: 'Coordinate people, records, and academic operations.', cards: ['Tasks requiring attention', 'People and permissions', 'Academic calendar'] },
  staff: { eyebrow: 'Staff workspace', title: 'Your school day', summary: 'Access the records and actions you need most.', cards: ['My schedule', 'Classes and attendance', 'Messages'] },
};

export function DashboardShell({ role }: { role: DashboardRole }) {
  const content = data[role];
  const { state } = useAuth();
  const userId = state.status === 'authenticated' ? state.session.userId : '';
  return <Screen eyebrow={content.eyebrow} title={content.title} description={content.summary}>
    {userId ? <ProfileImagePicker userId={userId} /> : null}
    <View style={styles.headerRow}><Text style={styles.status}>CONNECTED</Text><Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => router.replace('/')}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>{content.cards.map((card) => <Pressable key={card} accessibilityRole="button" style={styles.card}><Text style={styles.cardTitle}>{card}</Text><Text style={styles.cardText}>Module foundation ready for the next SAIS mobile step.</Text><Text style={styles.open}>Open module</Text></Pressable>)}</ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({ headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, status: { color: colors.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, signOut: { color: colors.muted, fontSize: 14, fontWeight: '700' }, cards: { gap: spacing.md, paddingBottom: spacing.lg }, card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, cardText: { color: colors.muted, fontSize: 14, lineHeight: 20 }, open: { color: colors.blue, fontSize: 13, fontWeight: '800', marginTop: spacing.sm } });
