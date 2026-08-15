import type { MobileSessionContext } from '../../types/auth';

export type AuthState =
  | { status: 'loading' }
  | { status: 'application-token-required' }
  | { status: 'application-token-gap'; message: string }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: MobileSessionContext }
  | { status: 'error'; message: string };

export function rolePath(role: string): '/owner' | '/tenant' | '/administrator' | '/staff' {
  switch (role.toLowerCase()) {
    case 'owner':
    case 'application_owner':
      return '/owner';
    case 'tenant':
      return '/tenant';
    case 'administrator':
    case 'admin':
      return '/administrator';
    default:
      return '/staff';
  }
}
