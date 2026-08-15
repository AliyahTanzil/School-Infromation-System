import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { ExaminationMark, validateScore } from '../../services/examinations/contracts';

type Props = { marks: ExaminationMark[]; onSaveDraft?: (marks: ExaminationMark[]) => void };

export function GradeEntry({ marks: initialMarks, onSaveDraft }: Props) {
  const [marks, setMarks] = useState(initialMarks);
  const errors = useMemo(() => marks.map((mark) => validateScore(mark.score, mark.maxScore)), [marks]);
  const incomplete = errors.filter(Boolean).length;
  const update = (index: number, value: string) => {
    const score = value === '' ? null : Number(value);
    setMarks((current) => current.map((mark, i) => (i === index ? { ...mark, score } : mark)));
  };
  return <View style={styles.container}>
    <Text style={styles.heading}>Enter scores</Text>
    <Text style={styles.caption}>Official grades and processing remain backend-authoritative.</Text>
    {marks.map((mark, index) => <View key={mark.studentId} style={styles.row}>
      <View style={styles.student}><Text style={styles.name}>{mark.studentName}</Text><Text style={styles.meta}>{mark.subjectCode} · Max {mark.maxScore}</Text></View>
      <TextInput accessibilityLabel={`Score for ${mark.studentName}`} keyboardType="decimal-pad" value={mark.score === null ? '' : String(mark.score)} onChangeText={(value) => update(index, value)} style={[styles.input, errors[index] && styles.invalid]} />
      {errors[index] && <Text style={styles.error}>{errors[index]}</Text>}
    </View>)}
    <Pressable accessibilityRole="button" disabled={incomplete > 0} onPress={() => onSaveDraft?.(marks)} style={[styles.button, incomplete > 0 && styles.disabled]}><Text style={styles.buttonText}>{incomplete ? `${incomplete} incomplete` : 'Save draft'}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ container: { gap: spacing.sm }, heading: { color: colors.ink, fontSize: 24, fontWeight: '700' }, caption: { color: colors.muted, lineHeight: 21 }, row: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingVertical: spacing.sm, gap: 4 }, student: { flex: 1 }, name: { color: colors.ink, fontWeight: '600' }, meta: { color: colors.muted, fontSize: 12 }, input: { borderColor: colors.line, borderRadius: 8, borderWidth: 1, color: colors.ink, padding: spacing.sm, width: 92 }, invalid: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 12 }, button: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: 10, padding: spacing.sm }, disabled: { opacity: 0.5 }, buttonText: { color: colors.paper, fontWeight: '700' } });
