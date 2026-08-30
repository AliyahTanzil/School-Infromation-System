import type { MobileSessionContext } from '../../types/auth';

export type AuthState =
  | { status: 'loading' }
  | { status: 'application-token-required' }
  | { status: 'application-token-gap'; message: string }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: MobileSessionContext }
  | { status: 'error'; message: string };

export function rolePath(role: string): '/administrator' | '/staff' {
  switch (role.toLowerCase()) {
    case 'owner':
    case 'application_owner':
    case 'tenant':
    case 'administrator':
    case 'admin':
      return '/administrator';
    default:
      return '/staff';
  }
}
