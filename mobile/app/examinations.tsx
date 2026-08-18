import { useMemo } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { GradeEntry } from '../components/examinations/GradeEntry';
import { ExaminationMark } from '../services/examinations/contracts';

const demoMarks: ExaminationMark[] = [
  { studentId: 'student-1', studentName: 'Student 1', subjectCode: 'MATH', score: null, maxScore: 100 },
  { studentId: 'student-2', studentName: 'Student 2', subjectCode: 'MATH', score: null, maxScore: 100 },
];

export default function Examinations() {
  const marks = useMemo(() => demoMarks, []);
  return <Screen title="Examinations" description="Assessment and mark entry">
    <GradeEntry marks={marks} onSaveDraft={() => router.back()} />
    <Text accessibilityRole="link" onPress={() => router.push('/results')} style={{ marginTop: 16 }}>View processed results</Text>
  </Screen>;
}
