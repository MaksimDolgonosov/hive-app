import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorToast } from '@/src/components/ui/ErrorToast';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <OfflineBanner />
      <ErrorToast />
    </View>
  );
}
