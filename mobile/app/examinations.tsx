import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { GradeEntry } from '../components/examinations/GradeEntry';
import type { ExaminationMark } from '../services/examinations/contracts';
import { listExaminations, listMarks, saveMarks } from '../services/examinations/service';

export default function Examinations() {
  const [marks, setMarks] = useState<ExaminationMark[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    listExaminations().then(async (examinations) => {
      const examination = examinations[0];
      if (!examination) throw new Error('No examinations are available.');
      setMarks(await listMarks(examination.id));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load examinations.'));
  }, []);
  if (error) return <Screen title="Examinations"><Text>{error}</Text></Screen>;
  if (!marks) return <Screen title="Examinations"><View><ActivityIndicator /><Text>Loading examination marks…</Text></View></Screen>;
  return <Screen title="Examinations" description="Assessment and mark entry">
    <GradeEntry marks={marks} onSaveDraft={async (next) => { const examinations = await listExaminations(); if (examinations[0]) await saveMarks(examinations[0].id, next); }} />
    <Text accessibilityRole="link" onPress={() => router.push('/results')} style={{ marginTop: 16 }}>View processed results</Text>
  </Screen>;
}
