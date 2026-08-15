import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { Screen } from '../components/ui/Screen';
export default function StaffRoute() { return <Screen eyebrow="Staff workspace" title="Your workday" description="Staff navigation will be permission-aware rather than relying on a single broad admin role."><Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.text}>Return</Text></Pressable></Screen>; }
const styles = StyleSheet.create({ button: { backgroundColor: colors.ink, borderRadius: 12, padding: spacing.md }, text: { color: colors.white, fontWeight: '800', textAlign: 'center' } });
