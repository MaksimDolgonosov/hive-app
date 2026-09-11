import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useAppColorScheme } from '@/src/hooks/useHiveTheme';

type ProfileGlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function ProfileGlassCard({ children, className }: ProfileGlassCardProps) {
  const colorScheme = useAppColorScheme();
  const blurTint = colorScheme === 'dark' ? 'dark' : 'light';

  // if (Platform.OS === 'android') {
  return <View className={`overflow-hidden  ${className ?? ''}`}>{children}</View>;
  // }

  // return (
  //   <View className={`overflow-hidden ${className ?? ''}`}>
  //     {/* <BlurView intensity={24} tint={blurTint} style={StyleSheet.absoluteFillObject} /> */}
  //     <View>{children}</View>
  //   </View>
  // );
}
