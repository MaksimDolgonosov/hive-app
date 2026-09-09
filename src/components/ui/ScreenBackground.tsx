import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

type ScreenBackgroundProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, className, style }: ScreenBackgroundProps) {
  const scheme = useAppColorScheme();
  const theme = useHiveTheme();
  const contentClassName = `flex-1 ${className ?? ''}`.trim();

  if (scheme === 'light') {
    return (
      <LinearGradient
        colors={[theme.gradients.screen[0], theme.gradients.screen[1]]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <View className={contentClassName} style={style}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View className={`bg-hive-bg ${contentClassName}`} style={style}>
      {children}
    </View>
  );
}
