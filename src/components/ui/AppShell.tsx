import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorToast } from '@/src/components/ui/ErrorToast';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';
import { HIVE_NATIVEWIND_VARS } from '@/src/theme/nativewind-vars';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const colorScheme = useAppColorScheme();

  return (
    <View style={[{ flex: 1 }, HIVE_NATIVEWIND_VARS[colorScheme]]}>
      {children}
      <OfflineBanner />
      <ErrorToast />
    </View>
  );
}
