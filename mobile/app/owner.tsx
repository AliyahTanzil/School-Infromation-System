import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { colors, spacing } from '../constants/theme';
export default function OwnerRoute() { return <Screen eyebrow="Owner workspace" title="Application owner" description="Tenant provisioning, platform oversight, and security controls will live here."><Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.text}>Return</Text></Pressable></Screen>; }
const styles = StyleSheet.create({ button: { backgroundColor: colors.ink, borderRadius: 12, padding: spacing.md }, text: { color: colors.white, fontWeight: '800', textAlign: 'center' } });
