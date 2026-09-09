import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColorScheme } from '@/src/hooks/useHiveTheme';

type ProfileGlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function ProfileGlassCard({ children, className }: ProfileGlassCardProps) {
  const colorScheme = useAppColorScheme();
  const blurTint = colorScheme === 'dark' ? 'dark' : 'light';

  if (Platform.OS === 'android') {
    return (
      <View
        className={`overflow-hidden rounded-hive border border-hive-stroke bg-hive-surface ${className ?? ''}`}
      >
        {children}
      </View>
    );
  }

  return (
    <View className={`overflow-hidden rounded-hive border border-hive-stroke ${className ?? ''}`}>
      <BlurView intensity={24} tint={blurTint} style={StyleSheet.absoluteFillObject} />
      <View className="bg-hive-surface/90">{children}</View>
    </View>
  );
}
