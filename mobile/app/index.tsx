import { Redirect } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';

export default function MobileHome() {
  const { state } = useAuth();
  if (state.status === 'application-token-required') {
    return <Redirect href="/application-token" />;
  }
  if (state.status === 'unauthenticated') {
    return <Redirect href="/auth" />;
  }
  if (state.status === 'authenticated') {
    return <Redirect href={state.session.role === 'administrator' ? '/administrator' : '/staff'} />;
  }
  return <Redirect href="/auth" />;
}
