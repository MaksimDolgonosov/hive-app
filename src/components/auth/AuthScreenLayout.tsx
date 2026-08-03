import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthScreenLayout({ children }: PropsWithChildren) {
  return (
    <LinearGradient
      colors={['#FFF8ED', '#FFE8B8', '#FFD54F44']}
      locations={[0, 0.5, 1]}
      className="flex-1"
      style={{ paddingTop: 50 }}
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            bounces={false}
            contentContainerClassName="grow px-5 pb-6 pt-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[390px] self-center">
              {/* <LanguageSwitcher className="mb-4" /> */}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
