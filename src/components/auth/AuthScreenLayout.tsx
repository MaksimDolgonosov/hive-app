import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';

export function AuthScreenLayout({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const colorScheme = useAppColorScheme();

  const content = (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        bounces={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 28),
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={{ width: '100%', maxWidth: 390, alignSelf: 'center' }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );

  if (colorScheme === 'light') {
    return content;
  }

  return <ScreenGradient>{content}</ScreenGradient>;
}
