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
      .catch(() => {})
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
        await authApi.logout();
        setUser(null);
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
  return useContext(AuthContext);
}
