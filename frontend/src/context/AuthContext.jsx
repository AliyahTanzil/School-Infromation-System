/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);
const adminDemoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN_DEMO === 'true';

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
      adminDemoEnabled,
      enterAdminDemo() {
        if (!adminDemoEnabled) return null;
        const demoUser = {
          id: 'demo-admin',
          email: 'admin-demo@localhost.test',
          roles: ['PLATFORM_ADMIN'],
          displayName: 'Development Admin',
        };
        setUser(demoUser);
        return demoUser;
      },
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
