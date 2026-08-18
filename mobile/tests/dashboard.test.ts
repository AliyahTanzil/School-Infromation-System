import type { DashboardRole } from '../components/dashboard/DashboardShell';

const roles: DashboardRole[] = ['owner', 'tenant', 'administrator', 'staff'];
if (new Set(roles).size !== 4) throw new Error('Every Mobile3 role must have one dashboard shell.');
