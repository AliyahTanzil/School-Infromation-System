import type { MobileSessionContext } from '../types/auth';

let session: MobileSessionContext | null = null;

export const sessionStore = {
  get: () => session,
  set: (next: MobileSessionContext) => { session = next; },
  clear: () => { session = null; },
  can: (permission: string) => session?.permissions.includes(permission) ?? false,
};
