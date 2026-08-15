import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { RoleCard } from '../components/ui/RoleCard';
import { Screen } from '../components/ui/Screen';
import { colors, spacing } from '../constants/theme';

export default function MobileHome() {
  return (
    <Screen eyebrow="SAIS mobile" title="School operations, ready for the day." description="Mobile Step 1 establishes the secure, tenant-aware navigation foundation for the existing SAIS platform.">
      <View style={styles.notice}><Text style={styles.noticeTitle}>Architecture preview</Text><Text style={styles.noticeText}>These workspaces are placeholders. Authentication and live data will consume the existing SAIS API in a later mobile step.</Text></View>
      <View style={styles.grid}>
        <RoleCard role="owner" label="Application owner" onPress={() => router.push('/owner')} />
        <RoleCard role="tenant" label="Tenant workspace" onPress={() => router.push('/tenant')} />
        <RoleCard role="administrator" label="Administrator" onPress={() => router.push('/administrator')} />
        <RoleCard role="staff" label="Staff workspace" onPress={() => router.push('/staff')} />
      </View>
      <Text style={styles.footer}>Connected architecture: Mobile → SAIS API → PostgreSQL</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.sky, borderRadius: 16, gap: 6, padding: spacing.md },
  noticeTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  noticeText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  grid: { gap: spacing.sm },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 'auto' },
});
