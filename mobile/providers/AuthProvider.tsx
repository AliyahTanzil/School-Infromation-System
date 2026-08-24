import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { MobileSessionContext } from '../types/auth';
import { rolePath, type AuthState } from '../services/auth/state';
import { login, logout, restoreSession } from '../services/auth/service';

const AuthContext = createContext<{
  state: AuthState;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}>({ state: { status: 'loading' }, signIn: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((session) => {
        if (!active) return;
        setState(session ? { status: 'authenticated', session } : { status: 'application-token-required' });
      })
      .catch(() => {
        if (active) setState({ status: 'error', message: 'Unable to restore the mobile session.' });
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    state,
    async signIn(identifier: string, password: string) {
      try {
        const session = await login({ identifier, password });
        setState({ status: 'authenticated', session });
        router.replace(rolePath(session.role));
      } catch (error) {
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Sign-in failed.' });
      }
    },
    async signOut() {
      await logout();
      setState({ status: 'application-token-required' });
      router.replace('/');
    },
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
