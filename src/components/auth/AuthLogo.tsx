import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Hexagon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

const DARK_ICON = require('../../../assets/Hive.icon/Assets/icon.png');
const MARK_SIZE = 32;
/** Та же доля, что ICON_RADIUS у экрана загрузки: 128 × 0.223. */
const MARK_RADIUS = Math.round(MARK_SIZE * 0.223);
/** Ромб экрана загрузки 90 внутри 128, здесь в том же масштабе. */
const LIGHT_MARK_SIZE = Math.round(90 * (MARK_SIZE / 128));
const DARK_LOGO_BACKING = '#13110C';

type AuthLogoProps = {
  subtitle?: string;
  mark?: 'hexagon' | 'appIcon';
};

function AppIconMark() {
  const theme = useHiveTheme();
  const isLight = useAppColorScheme() === 'light';

  if (!isLight) {
    return (
      <View
        style={{
          width: MARK_SIZE,
          height: MARK_SIZE,
          borderRadius: MARK_RADIUS,
          backgroundColor: DARK_LOGO_BACKING,
          overflow: 'hidden',
        }}
      >
        <Image
          contentFit="cover"
          source={DARK_ICON}
          style={{ width: MARK_SIZE, height: MARK_SIZE, borderRadius: MARK_RADIUS }}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...theme.gradients.logoMark]}
      end={{ x: 0.85, y: 1 }}
      locations={theme.gradients.logoMarkLocations}
      start={{ x: 0.15, y: 0 }}
      style={{
        width: MARK_SIZE,
        height: MARK_SIZE,
        borderRadius: MARK_RADIUS,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 4,
          left: 5,
          width: 9,
          height: 9,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 18,
          left: 20,
          width: 7,
          height: 7,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        }}
      />
      <Hexagon color="#FFFFFF" size={LIGHT_MARK_SIZE} strokeWidth={1} />
    </LinearGradient>
  );
}

function HexagonMark() {
  const theme = useHiveTheme();
  const isLight = useAppColorScheme() === 'light';

  if (isLight) {
    return (
      <LinearGradient
        colors={[...theme.gradients.logoMark]}
        end={{ x: 0.85, y: 1 }}
        locations={theme.gradients.logoMarkLocations}
        start={{ x: 0.15, y: 0 }}
        style={{
          width: MARK_SIZE,
          height: MARK_SIZE,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Hexagon color="#FFFFFF" fill="#FFFFFF" size={18} strokeWidth={0} />
      </LinearGradient>
    );
  }

  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-[8px]"
      style={{ backgroundColor: theme.accent }}
    >
      <Hexagon color={theme.textOnAccent} fill={theme.textOnAccent} size={18} strokeWidth={0} />
    </View>
  );
}

export function AuthLogo({ subtitle, mark = 'hexagon' }: AuthLogoProps) {
  return (
    <View className="mb-2 gap-3">
      <View className="flex-row items-center gap-2.5">
        {mark === 'appIcon' ? <AppIconMark /> : <HexagonMark />}
        <Text className="font-display text-[19px] font-bold uppercase tracking-[1.6px] text-hive-foreground">
          HIVE
        </Text>
      </View>
      {subtitle ? (
        <Text className="font-inter text-[15px] leading-[22px] text-hive-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}
