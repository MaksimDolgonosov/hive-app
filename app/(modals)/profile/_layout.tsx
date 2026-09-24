import { Stack } from 'expo-router';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function ProfileCollectionsLayout() {
  const theme = useHiveTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}
