import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorToast } from '@/src/components/ui/ErrorToast';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { HIVE_NATIVEWIND_VARS } from '@/src/theme/nativewind-vars';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const colorScheme = useAppColorScheme();
  const theme = useHiveTheme();
  const overlays = (
    <>
      <OfflineBanner />
      <ErrorToast />
    </>
  );

  return (
    <View
      style={[
        { flex: 1 },
        colorScheme === 'dark' ? { backgroundColor: theme.bg } : null,
        HIVE_NATIVEWIND_VARS[colorScheme],
      ]}
    >
      {colorScheme === 'light' ? (
        <ScreenGradient>
          {children}
          {overlays}
        </ScreenGradient>
      ) : (
        <>
          {children}
          {overlays}
        </>
      )}
    </View>
  );
}
