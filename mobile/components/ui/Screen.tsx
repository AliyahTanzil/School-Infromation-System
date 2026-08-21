import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { useSyncSnapshot } from '../../services/sync';

export function Screen({ children, eyebrow, title, description }: PropsWithChildren<{ eyebrow?: string; title: string; description?: string }>) {
  const sync = useSyncSnapshot();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
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
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  eyebrow: { color: colors.blue, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  syncBanner: { color: colors.blue, fontSize: 13, fontWeight: '700', lineHeight: 18 },
});
