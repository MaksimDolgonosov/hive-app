import '../global.css';

import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/components/auth/AuthProvider';
import { QueryProvider } from '@/src/components/providers/QueryProvider';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import i18n from '@/src/i18n';
import { useLocaleStore } from '@/src/stores/localeStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const localeReady = useLocaleStore((state) => state.isReady);
  const hydrateLocale = useLocaleStore((state) => state.hydrate);
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    void hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && localeReady) {
      SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded, localeReady]);

  if ((!fontsLoaded && !fontError) || !localeReady) {
    return <LoadingScreen />;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <QueryProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="(modals)"
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
              </Stack>
            </AuthProvider>
          </QueryProvider>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}
