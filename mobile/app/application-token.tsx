import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { colors, spacing } from '../constants/theme';
import { secureAuthStorage } from '../services/auth/secureStorage';

export default function ApplicationTokenScreen() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  async function continueWithToken() {
    if (!token.trim()) { setError('Enter the application token provided by your authorized SAIS owner.'); return; }
    await secureAuthStorage.setApplicationToken(token.trim());
    router.replace('/auth');
  }
  return <Screen eyebrow="Secure enrollment" title="Connect this device" description="Use the application token issued by an authorized SAIS owner. It is stored only in secure device storage."><TextInput autoCapitalize="none" autoCorrect={false} placeholder="Application token" placeholderTextColor={colors.muted} secureTextEntry value={token} onChangeText={setToken} style={styles.input} /><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={continueWithToken} style={styles.button}><Text style={styles.buttonText}>Continue securely</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ input: { borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, padding: spacing.md }, error: { color: colors.danger, minHeight: 24, paddingVertical: spacing.sm }, button: { backgroundColor: colors.blue, borderRadius: 12, padding: spacing.md }, buttonText: { color: colors.white, fontWeight: '800', textAlign: 'center' } });
