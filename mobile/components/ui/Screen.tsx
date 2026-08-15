import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export function Screen({ children, eyebrow, title, description }: PropsWithChildren<{ eyebrow?: string; title: string; description?: string }>) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
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
});
