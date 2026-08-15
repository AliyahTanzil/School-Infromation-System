import { UserRole } from '../api/contracts';

export type Permission = 'tenant.read' | 'people.read' | 'people.manage' | 'academic.read' | 'assessment.manage' | 'communication.read';
const grants: Record<UserRole, Permission[]> = { owner: ['tenant.read', 'people.read', 'people.manage', 'academic.read', 'assessment.manage', 'communication.read'], tenant: ['tenant.read', 'people.read', 'people.manage', 'academic.read', 'communication.read'], administrator: ['tenant.read', 'people.read', 'people.manage', 'academic.read', 'assessment.manage', 'communication.read'], staff: ['academic.read', 'communication.read'], teacher: ['academic.read', 'assessment.manage', 'communication.read'], student: ['communication.read'] };
export function can(role: UserRole | undefined, permission: Permission) { return !!role && grants[role].includes(permission); }
