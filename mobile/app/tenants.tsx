import { ManagementList } from '../components/management/ManagementList';

const tenants = [{ id: 't1', title: 'Demo school tenant', subtitle: 'Active · Central district', status: 'Active' }, { id: 't2', title: 'North campus', subtitle: 'Pending configuration', status: 'Pending' }];
export default function TenantsRoute() { return <ManagementList title="Tenants" description="Review tenant status and school context without crossing tenant boundaries." items={tenants} />; }
