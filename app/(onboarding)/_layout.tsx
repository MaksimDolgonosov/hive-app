import { Stack } from 'expo-router';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function OnboardingLayout() {
  const theme = useHiveTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="step1" />
      <Stack.Screen name="step2" />
      <Stack.Screen name="step3" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="camera-permission" />
    </Stack>
  );
}
