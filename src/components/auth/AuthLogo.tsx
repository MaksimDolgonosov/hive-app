import { LinearGradient } from 'expo-linear-gradient';
import { Hexagon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

type AuthLogoProps = {
  subtitle?: string;
};

export function AuthLogo({ subtitle }: AuthLogoProps) {
  const theme = useHiveTheme();
  const isLight = useAppColorScheme() === 'light';

  return (
    <View className="mb-2 gap-3">
      <View className="flex-row items-center gap-2.5">
        {isLight ? (
          <LinearGradient
            colors={[...theme.gradients.logoMark]}
            end={{ x: 0.85, y: 1 }}
            locations={theme.gradients.logoMarkLocations}
            start={{ x: 0.15, y: 0 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Hexagon color="#FFFFFF" fill="#FFFFFF" size={18} strokeWidth={0} />
          </LinearGradient>
        ) : (
          <View
            className="h-8 w-8 items-center justify-center rounded-[8px]"
            style={{ backgroundColor: theme.accent }}
          >
            <Hexagon color={theme.textOnAccent} fill={theme.textOnAccent} size={18} strokeWidth={0} />
          </View>
        )}
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
