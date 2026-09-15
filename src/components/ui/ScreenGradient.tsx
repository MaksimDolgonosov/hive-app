import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ScreenGradientProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const theme = useHiveTheme();

  return (
    <LinearGradient
      colors={[...theme.gradients.screen]}
      end={{ x: 0.5, y: 1 }}
      locations={theme.gradients.screenLocations}
      start={{ x: 0.5, y: 0 }}
      style={[{ flex: 1, backgroundColor: theme.gradients.screen[0] }, style]}
    >
      {children}
    </LinearGradient>
  );
}
