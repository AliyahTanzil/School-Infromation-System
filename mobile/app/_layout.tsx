import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { rolePath } from '../services/auth/state';
import { startSync, stopSync } from '../services/sync';

function GuardedStack() {
  const { state } = useAuth();
  const segments = useSegments();
  const current = segments[0];

  if (state.status === 'loading') return null;
  if (state.status === 'application-token-required' && current !== 'application-token') return <Redirect href="/application-token" />;
  if (state.status === 'unauthenticated' && current !== 'auth') return <Redirect href="/auth" />;
  if (state.status === 'authenticated') {
    const expected = rolePath(state.session.role).slice(1);
    const publicRoute = current === undefined || current === 'auth' || current === 'application-token';
    if (publicRoute || (current && ['owner', 'tenant', 'administrator', 'staff'].includes(current) && current !== expected)) {
      return <Redirect href={rolePath(state.session.role)} />;
    }
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}

export default function RootLayout() {
  useEffect(() => { void startSync(); return () => stopSync(); }, []);
  return (
    <>
      <StatusBar style="dark" />
      <AuthProvider><GuardedStack /></AuthProvider>
    </>
  );
}
