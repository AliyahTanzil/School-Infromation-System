import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import type { AppRole } from '../../types/auth';

export function RoleCard({ role, label, onPress }: { role: AppRole; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${label}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.badge}>SAIS WORKSPACE</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.role}>{role}</Text>
      <Text style={styles.link}>Open workspace  →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, minHeight: 124, padding: spacing.md },
  pressed: { backgroundColor: colors.sky, opacity: 0.88 },
  badge: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  label: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.xs },
  role: { color: colors.muted, fontSize: 14 },
  link: { color: colors.blue, fontSize: 14, fontWeight: '700', marginTop: spacing.sm },
});
