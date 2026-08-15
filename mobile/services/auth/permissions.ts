import { UserRole } from '../api/contracts';

export type Permission = 'tenant.read' | 'people.read' | 'people.manage' | 'academic.read' | 'assessment.manage';
const grants: Record<UserRole, Permission[]> = { owner: ['tenant.read', 'people.read', 'people.manage', 'academic.read', 'assessment.manage'], tenant: ['tenant.read', 'people.read', 'people.manage', 'academic.read'], administrator: ['tenant.read', 'people.read', 'people.manage', 'academic.read', 'assessment.manage'], staff: ['academic.read'], teacher: ['academic.read', 'assessment.manage'], student: [] };
export function can(role: UserRole | undefined, permission: Permission) { return !!role && grants[role].includes(permission); }
