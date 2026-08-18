import { Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { colors } from '../constants/theme';

export default function Results() {
  return <Screen title="Results" description="Published academic performance">
    <View style={{ backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 }}>
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>No published results loaded</Text>
      <Text style={{ color: colors.muted, lineHeight: 21 }}>Results, grades, rankings, and report cards are calculated and published by SAIS services.</Text>
    </View>
  </Screen>;
}
