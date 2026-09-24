import { Stack } from 'expo-router';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function SettingsLayout() {
  const theme = useHiveTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationMatchesGesture: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}
