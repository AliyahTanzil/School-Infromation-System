import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ManagementList } from '../components/management/ManagementList';
import { managementData } from '../services/data/management';

export default function PeopleRoute() {
  const [people, setPeople] = useState<{ id: string; title: string; subtitle: string; status: string }[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { managementData.listPeople().then((page) => setPeople(page.items.map((person) => ({ id: person.id, title: person.name, subtitle: `${person.role} · ${person.email}`, status: person.status })))).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load people.')); }, []);
  if (error) return <ManagementList title="People" description="Search people assigned to your current school context." items={[]} empty={error} />;
  if (!people) return <ActivityIndicator accessibilityLabel="Loading people" />;
  return <ManagementList title="People" description="Search people assigned to your current school context." items={people} />;
}
