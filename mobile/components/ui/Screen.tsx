import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import { useSyncSnapshot } from '../../services/sync';

export function Screen({ children, eyebrow, title, description }: PropsWithChildren<{ eyebrow?: string; title: string; description?: string }>) {
  const sync = useSyncSnapshot();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View><Text style={styles.brandName}>SAIS <Text style={styles.brandSlash}>/</Text> identity</Text></View>
        {sync.state !== 'online' || sync.pendingCount > 0 ? <Text accessibilityLiveRegion="polite" style={styles.syncBanner}>{sync.state === 'offline' ? 'Offline mode' : sync.state === 'syncing' ? `Syncing ${sync.pendingCount} pending change${sync.pendingCount === 1 ? '' : 's'}…` : sync.state === 'conflict' ? `${sync.pendingCount} change${sync.pendingCount === 1 ? '' : 's'} need review` : sync.state === 'error' ? 'Some changes need attention' : `${sync.pendingCount} pending change${sync.pendingCount === 1 ? '' : 's'}`}</Text> : null}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, maxWidth: 720, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md, width: '100%' },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  brandMark: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: radii.sm, height: 34, justifyContent: 'center', width: 34 },
  brandMarkText: { color: colors.white, fontSize: 18, fontWeight: '900' },
  brandName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  brandSlash: { color: colors.muted, fontWeight: '500' },
  eyebrow: { color: colors.blue, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.5, lineHeight: 40 },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 520 },
  syncBanner: { color: colors.blue, fontSize: 13, fontWeight: '700', lineHeight: 18 },
});
