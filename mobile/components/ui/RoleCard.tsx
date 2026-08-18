import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import type { AppRole } from '../../types/auth';

export function RoleCard({ role, label, onPress }: { role: AppRole; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.role}>{role}</Text>
      <Text style={styles.link}>Open workspace</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  pressed: { opacity: 0.72 },
  label: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  role: { color: colors.muted, fontSize: 14 },
  link: { color: colors.blue, fontSize: 14, fontWeight: '700', marginTop: spacing.sm },
});
