import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';
import { useLocaleStore } from '@/src/stores/localeStore';

const APP_ICON = require('../../../assets/Hive.icon/Assets/icon.png');
const ICON_SIZE = 128;
const ICON_RADIUS = Math.round(ICON_SIZE * 0.223);

type LoadingScreenProps = {
  bottomOffset?: number;
};

export function LoadingScreen({ bottomOffset = 0 }: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const language = useLocaleStore((state) => state.language);
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const tagline = language === 'en' ? en.common.appTagline : ru.common.appTagline;
  const footerPadding = bottomOffset > 0 ? bottomOffset : Math.max(insets.bottom, 48);

  return (
    <LinearGradient
      colors={[...theme.gradients.screen]}
      locations={theme.gradients.screenLocations}
      style={styles.root}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={styles.logoShadow}>
          <Image
            contentFit="cover"
            source={APP_ICON}
            style={styles.logoMark}
          />
        </View>
        <View style={styles.wordmark}>
          <Text style={[styles.appName, { color: theme.text, fontFamily: theme.fontDisplay }]}>
            HIVE
          </Text>
          <Text style={[styles.tagline, { color: theme.textMuted, fontFamily: theme.fontBody }]}>
            {tagline}
          </Text>
        </View>
      </View>
      <View style={[styles.footer, { paddingBottom: footerPadding }]}>
        <HiveLoader size={28} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoShadow: {
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 10,
  },
  logoMark: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    overflow: 'hidden',
  },
  wordmark: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 32,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
