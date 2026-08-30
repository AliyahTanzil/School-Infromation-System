import type { DashboardRole } from '../components/dashboard/DashboardShell';

const roles: DashboardRole[] = ['administrator', 'staff'];
if (new Set(roles).size !== 2) throw new Error('Every single-school mobile role must have one dashboard shell.');
