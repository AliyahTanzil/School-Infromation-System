import { UserRole } from '../api/contracts';

export type Permission = 'people.read' | 'people.manage' | 'academic.read' | 'assessment.manage' | 'communication.read';
const grants: Record<UserRole, Permission[]> = { administrator: ['people.read', 'people.manage', 'academic.read', 'assessment.manage', 'communication.read'], staff: ['academic.read', 'communication.read'], teacher: ['academic.read', 'assessment.manage', 'communication.read'], student: ['communication.read'] };
export function can(role: UserRole | undefined, permission: Permission) { return !!role && grants[role].includes(permission); }
