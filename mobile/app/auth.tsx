import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { Screen } from '../components/ui/Screen';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../providers/AuthProvider';

export default function AuthScreen() {
  const { state, signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  return <Screen eyebrow="SAIS authentication" title="Sign in to your workspace" description="The SAIS backend remains the authority for credentials, account status, role, permissions, and tenant context."><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email or username" placeholderTextColor={colors.muted} value={identifier} onChangeText={setIdentifier} style={styles.input} /><TextInput placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} style={styles.input} /><Text accessibilityRole="alert" style={styles.error}>{state.status === 'error' ? state.message : ''}</Text><Pressable accessibilityRole="button" onPress={() => signIn(identifier, password)} style={styles.button}><Text style={styles.buttonText}>Sign in</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ input: { borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, marginBottom: spacing.sm, padding: spacing.md }, error: { color: colors.danger, minHeight: 24 }, button: { backgroundColor: colors.blue, borderRadius: 12, padding: spacing.md }, buttonText: { color: colors.white, fontWeight: '800', textAlign: 'center' } });
