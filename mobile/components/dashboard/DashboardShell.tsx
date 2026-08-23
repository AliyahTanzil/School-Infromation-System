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
    <View style={styles.headerRow}><View><Text style={styles.kicker}>YOUR WORKSPACE</Text><Text style={styles.status}>ALL SYSTEMS OPERATIONAL</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => router.replace('/')} style={styles.signOutButton}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <View style={styles.today}><View style={styles.todayCopy}><Text style={styles.todayLabel}>TODAY&apos;S FOCUS</Text><Text style={styles.todayTitle}>Keep your school moving forward.</Text><Text style={styles.todayText}>Your most important work is one tap away.</Text></View><Text style={styles.todayMark}>✓</Text></View>
    <ScrollView contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>{content.cards.map((card, index) => <Pressable key={card} accessibilityRole="button" style={[styles.card, index === 0 ? styles.featuredCard : null]}><View style={styles.cardTop}><Text style={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.open}>Open</Text></View><Text style={styles.cardTitle}>{card}</Text><Text style={styles.cardText}>{index === 0 ? 'Start with the work that needs your attention today.' : 'Everything you need for a smoother school day.'}</Text></Pressable>)}</ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({ headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, kicker: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, status: { color: colors.success, fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 }, signOutButton: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, signOut: { color: colors.muted, fontSize: 13, fontWeight: '700' }, today: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg }, todayCopy: { flex: 1, gap: spacing.xs }, todayLabel: { color: colors.sky, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, todayTitle: { color: colors.white, fontSize: 20, fontWeight: '800', lineHeight: 26 }, todayText: { color: '#C7D0E0', fontSize: 14, lineHeight: 20 }, todayMark: { color: colors.successSurface, fontSize: 32, fontWeight: '800', paddingLeft: spacing.md }, cards: { gap: spacing.md, paddingBottom: spacing.lg }, card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md }, featuredCard: { borderColor: colors.blue, borderWidth: 2 }, cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, cardIndex: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, cardText: { color: colors.muted, fontSize: 14, lineHeight: 20 }, open: { color: colors.blue, fontSize: 13, fontWeight: '800' } });
