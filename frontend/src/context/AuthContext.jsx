/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .refresh()
      .then(() => authApi.me())
      .then(setUser)
      .catch((error) => {
        // A fresh browser has no refresh cookie; this is an unauthenticated state,
        // not an application failure that should interrupt the login screen.
        if (error.response?.status === 401) {
          setUser(null);
          return;
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(values) {
        const result = await authApi.login(values);
        setUser(result.user);
        return result;
      },
      async register(values) {
        const result = await authApi.register(values);
        setUser(result.user);
        return result;
      },
      async logout() {
        try {
          await authApi.logout();
        } finally {
          // Clear local auth state even if the server session already expired.
          setUser(null);
        }
      },
      async forgotPassword(email) {
        return authApi.forgotPassword(email);
      },
      async resetPassword(values) {
        return authApi.resetPassword(values);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  return (
    context ?? {
      user: null,
      loading: false,
      error: null,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      refresh: async () => null,
    }
  );
}
