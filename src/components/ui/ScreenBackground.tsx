import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';
import { HIVE_NATIVEWIND_VARS } from '@/src/theme/nativewind-vars';

type ScreenBackgroundProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, className, style }: ScreenBackgroundProps) {
  const colorScheme = useAppColorScheme();

  return (
    <ScreenGradient>
      <View
        className={`flex-1 ${className ?? ''}`.trim()}
        style={[HIVE_NATIVEWIND_VARS[colorScheme], style]}
      >
        {children}
      </View>
    </ScreenGradient>
  );
}
