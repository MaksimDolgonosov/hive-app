import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ScreenBackgroundProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, className, style }: ScreenBackgroundProps) {
  const theme = useHiveTheme();
  const contentClassName = `flex-1 ${className ?? ''}`.trim();

  return (
    <LinearGradient
      colors={[...theme.gradients.screen]}
      end={{ x: 0.5, y: 1 }}
      locations={theme.gradients.screenLocations}
      start={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className={contentClassName} style={style}>
        {children}
      </View>
    </LinearGradient>
  );
}
