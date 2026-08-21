import * as SecureStore from 'expo-secure-store';
import type { MobileSessionContext } from '../types/auth';

const sessionKey = 'sais.session-context';
let session: MobileSessionContext | null = null;

export const sessionStore = {
  get: () => session,
  async hydrate() {
    const raw = await SecureStore.getItemAsync(sessionKey);
    if (!raw) return null;
    try {
      session = JSON.parse(raw) as MobileSessionContext;
      return session;
    } catch {
      await SecureStore.deleteItemAsync(sessionKey);
      session = null;
      return null;
    }
  },
  async set(next: MobileSessionContext) {
    session = next;
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(next));
  },
  async clear() {
    session = null;
    await SecureStore.deleteItemAsync(sessionKey);
  },
  can: (permission: string) => session?.permissions.includes(permission) ?? false,
};
