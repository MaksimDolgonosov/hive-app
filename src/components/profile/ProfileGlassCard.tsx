import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type ProfileGlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function ProfileGlassCard({ children, className }: ProfileGlassCardProps) {
  if (Platform.OS === 'android') {
    return (
      <View
        className={`overflow-hidden rounded-hive border border-[#F5A62333] bg-[#FFFFFFE6] ${className ?? ''}`}
        style={styles.shadow}
      >
        {children}
      </View>
    );
  }

  return (
    <View className={`overflow-hidden rounded-hive border border-[#F5A62333] ${className ?? ''}`} style={styles.shadow}>
      <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFillObject} />
      <View className="bg-white/85">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 4,
  },
});
