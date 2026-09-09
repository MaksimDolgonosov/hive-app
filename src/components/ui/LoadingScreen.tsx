import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Hexagon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';
import { useLocaleStore } from '@/src/stores/localeStore';

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
    <LinearGradient colors={[...theme.gradients.screen]} locations={[0, 0.55, 1]} style={styles.root}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={styles.logoShadow}>
          <View style={[styles.logoMark, { backgroundColor: theme.accent }]}>
            <Hexagon
              color={theme.textOnAccent}
              fill={theme.textOnAccent}
              size={44}
              strokeWidth={0}
            />
          </View>
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
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
