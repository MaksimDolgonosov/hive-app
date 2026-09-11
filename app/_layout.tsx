import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/components/auth/AuthProvider';
import { AppShell } from '@/src/components/ui/AppShell';
import { QueryProvider } from '@/src/components/providers/QueryProvider';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import i18n from '@/src/i18n';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { useLocaleStore } from '@/src/stores/localeStore';
import { HIVE_NATIVEWIND_VARS } from '@/src/theme/nativewind-vars';
import { HiveThemes } from '@/src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const localeReady = useLocaleStore((state) => state.isReady);
  const hydrateLocale = useLocaleStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const preferencesReady = usePreferencesStore((state) => state.isHydrated);
  const colorScheme = usePreferencesStore((state) => state.colorScheme);
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    void hydrateLocale();
    void hydratePreferences();
  }, [hydrateLocale, hydratePreferences]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(HiveThemes[colorScheme].bg);

    if (Platform.OS !== 'android') {
      return;
    }

    const navigationBar = requireOptionalNativeModule<{
      setButtonStyleAsync: (style: 'light' | 'dark') => Promise<void>;
    }>('ExpoNavigationBar');

    if (!navigationBar) {
      return;
    }

    void navigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme]);

  const isReady = (fontsLoaded || Boolean(fontError)) && localeReady && preferencesReady;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={[{ flex: 1, backgroundColor: HiveThemes[colorScheme].bg }, HIVE_NATIVEWIND_VARS[colorScheme]]}>
        <LoadingScreen />
      </View>
    );
  }

  const palette = HiveThemes[colorScheme];
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
        <ThemeProvider
          value={{
            ...navigationTheme,
            colors: {
              ...navigationTheme.colors,
              background: palette.bg,
              card: palette.surface,
              text: palette.text,
              border: palette.stroke,
              primary: palette.accent,
            },
          }}
        >
          <QueryProvider>
            <AuthProvider>
              <AppShell>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="(modals)"
                    options={{ headerShown: false, presentation: 'fullScreenModal' }}
                  />
                </Stack>
              </AppShell>
            </AuthProvider>
          </QueryProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}
