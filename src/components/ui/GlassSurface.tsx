import { BlurView } from 'expo-blur';
import type { GlassActiveRenderer } from 'expo-liquid-glass-view';
import { useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { shouldUseLiquidGlass } from '@/src/utils/liquid-glass';

const GLASS_TINT = 'rgba(255, 255, 255, 0.18)';

const GLASS_METAL = {
  blurRadius: 6,
  border: { opacity: 0.28, width: 1 },
  frost: 0.12,
  highlight: { angle: 135, intensity: 0.22 },
  saturation: 1.45,
} as const;

type GlassSurfaceProps = {
  children: ReactNode;
  cornerRadius: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  interactive?: boolean;
};

export function GlassSurface({
  children,
  cornerRadius,
  style,
  containerStyle,
  interactive = false,
}: GlassSurfaceProps) {
  const [iosRenderer, setIosRenderer] = useState<GlassActiveRenderer | null>(null);
  const useLiquidGlass = shouldUseLiquidGlass() && iosRenderer !== 'fallback-blur';
  const chrome = [styles.chrome, { borderRadius: cornerRadius }, style];

  if (Platform.OS !== 'ios' || !useLiquidGlass) {
    if (Platform.OS === 'ios') {
      return (
        <BlurView intensity={24} style={chrome} tint="light">
          <View style={containerStyle}>{children}</View>
        </BlurView>
      );
    }

    return (
      <View style={[chrome, styles.android]}>
        <View style={containerStyle}>{children}</View>
      </View>
    );
  }

  const { LiquidGlassView } =
    require('expo-liquid-glass-view') as typeof import('expo-liquid-glass-view');

  return (
    <LiquidGlassView
      containerStyle={containerStyle}
      cornerRadius={cornerRadius}
      cornerStyle="continuous"
      interactive={interactive}
      metal={GLASS_METAL}
      style={style}
      tint={GLASS_TINT}
      variant="clear"
      onRendererChange={setIosRenderer}
    >
      {children}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  chrome: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  android: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
});
