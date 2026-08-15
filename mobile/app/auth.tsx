import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { colors, spacing } from '../constants/theme';

export default function AuthPlaceholder() {
  return <Screen eyebrow="Authentication" title="Sign-in comes next." description="This route is reserved for the existing SAIS authentication contract. No credentials or server secrets are stored in this client."><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>Back to role selection</Text></Pressable></Screen>;
}

const styles = StyleSheet.create({ button: { backgroundColor: colors.blue, borderRadius: 12, padding: spacing.md }, buttonText: { color: colors.white, fontWeight: '800', textAlign: 'center' } });
