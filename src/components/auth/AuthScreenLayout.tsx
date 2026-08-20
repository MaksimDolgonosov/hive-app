import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const GRADIENT_TOP_COLOR = '#FFF8ED';

export function AuthScreenLayout({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[GRADIENT_TOP_COLOR, '#FFE8B8', '#FFD54F44']}
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          bounces={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 24),
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
