import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import { Screen } from '../ui/Screen';

type Item = { id: string; title: string; subtitle: string; status?: string };

export function ManagementList({ title, description, items, empty = 'No records found.' }: { title: string; description: string; items: Item[]; empty?: string }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => items.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  return <Screen eyebrow="SAIS management" title={title} description={description}>
    <TextInput accessibilityLabel="Search records" placeholder="Search records" value={search} onChangeText={setSearch} style={styles.search} />
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {filtered.length ? filtered.map((item) => <Pressable accessibilityRole="button" key={item.id} style={styles.row}><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.subtitle}>{item.subtitle}</Text></View>{item.status ? <Text style={styles.status}>{item.status}</Text> : null}</Pressable>) : <Text style={styles.empty}>{empty}</Text>}
    </ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({ search: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 16, marginBottom: spacing.md, padding: spacing.md }, list: { gap: spacing.sm, paddingBottom: spacing.xl }, row: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md }, copy: { flex: 1, gap: spacing.xs }, title: { color: colors.ink, fontSize: 16, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 13 }, status: { color: colors.blue, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, empty: { color: colors.muted, padding: spacing.lg, textAlign: 'center' } });
