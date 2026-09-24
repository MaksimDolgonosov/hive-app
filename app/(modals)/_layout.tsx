import { Stack } from 'expo-router';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function ModalsLayout() {
  const theme = useHiveTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'fullScreenModal',
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="camera" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
      <Stack.Screen name="preview" options={{ presentation: 'card' }} />
      <Stack.Screen name="first-capture" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="push-permission" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="waitlist" options={{ presentation: 'card' }} />
      <Stack.Screen name="sting/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen
        name="hive/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="place/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="partner/apply" options={{ presentation: 'card' }} />
      <Stack.Screen name="partner/onsite" options={{ presentation: 'card' }} />
      <Stack.Screen name="partner/places" options={{ presentation: 'card' }} />
      <Stack.Screen name="partner/place/edit" options={{ presentation: 'card' }} />
    </Stack>
  );
}
