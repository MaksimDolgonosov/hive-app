import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { ScreenGradient } from '@/src/components/ui/ScreenGradient';

type ScreenBackgroundProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, className, style }: ScreenBackgroundProps) {
  return (
    <ScreenGradient>
      <View className={`flex-1 ${className ?? ''}`.trim()} style={style}>
        {children}
      </View>
    </ScreenGradient>
  );
}
