import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';
import { useLocaleStore } from '@/src/stores/localeStore';

const LIGHT_ICON = require('../../../assets/images/splash-icon.png');
const DARK_ICON = require('../../../assets/Hive.icon/Assets/icon.png');
const ICON_SIZE = 128;
const ICON_RADIUS = Math.round(ICON_SIZE * 0.223);
const LIGHT_LOADER_COLOR = '#F5A623';
const LIGHT_GLOW_COLOR = '#FF8C00';
const DARK_LOGO_BACKING = '#13110C';
const BRAND_GLOW_WIDTH = 420;
const BRAND_GLOW_HEIGHT = 360;
const LOGO_BLOOM_SIZE = 192;

type LoadingScreenProps = {
  bottomOffset?: number;
};

export function LoadingScreen({ bottomOffset = 0 }: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const language = useLocaleStore((state) => state.language);
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const tagline = language === 'en' ? en.common.appTagline : ru.common.appTagline;
  const footerPadding = bottomOffset > 0 ? bottomOffset : Math.max(insets.bottom, 48);
  const glowColor = isDark ? theme.accent : LIGHT_GLOW_COLOR;

  return (
    <ScreenGradient style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View pointerEvents="none" style={styles.brandGlow}>
        <Svg height={BRAND_GLOW_HEIGHT} width={BRAND_GLOW_WIDTH}>
          <Defs>
            <RadialGradient id="loadingBrandGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={glowColor} stopOpacity={0.22} />
              <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={BRAND_GLOW_WIDTH / 2}
            cy={BRAND_GLOW_HEIGHT / 2}
            fill="url(#loadingBrandGlow)"
            rx={BRAND_GLOW_WIDTH / 2}
            ry={BRAND_GLOW_HEIGHT / 2}
          />
        </Svg>
      </View>
      <View style={styles.content}>
        <View style={styles.logoStage}>
          <View pointerEvents="none" style={styles.logoBloom}>
            <Svg height={LOGO_BLOOM_SIZE} width={LOGO_BLOOM_SIZE}>
              <Defs>
                <RadialGradient id="loadingLogoGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0" stopColor={glowColor} stopOpacity={0.35} />
                  <Stop offset="0.4" stopColor={glowColor} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse
                cx={LOGO_BLOOM_SIZE / 2}
                cy={LOGO_BLOOM_SIZE / 2}
                fill="url(#loadingLogoGlow)"
                rx={LOGO_BLOOM_SIZE / 2}
                ry={LOGO_BLOOM_SIZE / 2}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: isDark ? DARK_LOGO_BACKING : glowColor,
                shadowColor: glowColor,
              },
            ]}
          >
            <Image
              contentFit="cover"
              source={isDark ? DARK_ICON : LIGHT_ICON}
              style={styles.logoMark}
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
        <HiveLoader
          color={isDark ? theme.accent : LIGHT_LOADER_COLOR}
          size={36}
          style={{ marginBottom: 16 }}
        />
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  brandGlow: {
    position: 'absolute',
    top: -160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoStage: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBloom: {
    position: 'absolute',
    top: 12 - (LOGO_BLOOM_SIZE - ICON_SIZE) / 2,
    left: -((LOGO_BLOOM_SIZE - ICON_SIZE) / 2),
    width: LOGO_BLOOM_SIZE,
    height: LOGO_BLOOM_SIZE,
  },
  logoWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 18,
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
