import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';

type ScreenBackgroundProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, className, style }: ScreenBackgroundProps) {
  const colorScheme = useAppColorScheme();
  const content = (
    <View className={`flex-1 ${className ?? ''}`.trim()} style={style}>
      {children}
    </View>
  );

  if (colorScheme === 'light') {
    return content;
  }

  return <ScreenGradient>{content}</ScreenGradient>;
}
