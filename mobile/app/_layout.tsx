import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { AuthProvider } from '../providers/AuthProvider';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <AuthProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} /></AuthProvider>
    </>
  );
}
