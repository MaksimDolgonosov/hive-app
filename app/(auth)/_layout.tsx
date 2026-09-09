import { Stack } from 'expo-router';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function AuthLayout() {
  const theme = useHiveTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
