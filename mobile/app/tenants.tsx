import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ManagementList } from '../components/management/ManagementList';
import { managementData } from '../services/data/management';

export default function TenantsRoute() {
  const [tenants, setTenants] = useState<{ id: string; title: string; subtitle: string; status: string }[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { managementData.listTenants().then((page) => setTenants(page.items.map((tenant) => ({ id: tenant.id, title: tenant.name, subtitle: tenant.domain ?? 'SAIS tenant workspace', status: tenant.status })))).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load tenants.')); }, []);
  if (error) return <ManagementList title="Tenants" description="Review tenant status and school context without crossing tenant boundaries." items={[]} empty={error} />;
  if (!tenants) return <ActivityIndicator accessibilityLabel="Loading tenants" />;
  return <ManagementList title="Tenants" description="Review tenant status and school context without crossing tenant boundaries." items={tenants} />;
}
