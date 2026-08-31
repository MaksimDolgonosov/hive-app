import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Hexagon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';
import { useLocaleStore } from '@/src/stores/localeStore';

const BACKGROUND_COLORS = ['#FFF8ED', '#FFE8B8', '#FFE082'] as const;
const LOGO_GRADIENT = ['#F5A623', '#FF8C00'] as const;

type LoadingScreenProps = {
  bottomOffset?: number;
};

export function LoadingScreen({ bottomOffset = 0 }: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const language = useLocaleStore((state) => state.language);
  const tagline = language === 'en' ? en.common.appTagline : ru.common.appTagline;
  const footerPadding = bottomOffset > 0 ? bottomOffset : Math.max(insets.bottom, 48);

  return (
    <LinearGradient colors={[...BACKGROUND_COLORS]} locations={[0, 0.55, 1]} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoShadow}>
          <LinearGradient
            colors={[...LOGO_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoMark}
          >
            <Hexagon color="#FFFFFF" size={60} strokeWidth={2} />
          </LinearGradient>
        </View>
        <View style={styles.wordmark}>
          <Text style={styles.appName}>Hive</Text>
          <Text style={styles.tagline}>{tagline}</Text>
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
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.33,
    shadowRadius: 28,
    elevation: 10,
  },
  logoMark: {
    width: 120,
    height: 120,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordmark: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#2C1810',
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B7355',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
