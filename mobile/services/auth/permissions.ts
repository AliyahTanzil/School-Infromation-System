import { UserRole } from '../api/contracts';

export type Permission = 'tenant.read' | 'people.read' | 'people.manage' | 'academic.read';
const grants: Record<UserRole, Permission[]> = { owner: ['tenant.read', 'people.read', 'people.manage', 'academic.read'], tenant: ['tenant.read', 'people.read', 'people.manage', 'academic.read'], administrator: ['tenant.read', 'people.read', 'people.manage', 'academic.read'], staff: ['academic.read'], teacher: ['academic.read'], student: [] };
export function can(role: UserRole | undefined, permission: Permission) { return !!role && grants[role].includes(permission); }
