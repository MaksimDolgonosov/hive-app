import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export function AuthScreenLayout({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const theme = useHiveTheme();

  return (
    <LinearGradient colors={[...theme.gradients.authGlow]} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: theme.accentSoft,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: 'rgba(255, 184, 0, 0.08)',
        }}
      />
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
    </LinearGradient>
  );
}
