import { LinearGradient } from 'expo-linear-gradient';
import { Hexagon } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

type HiveMarkerFaceProps = {
  count: number;
  animate?: boolean;
};

export function HiveMarkerFace({ count, animate = true }: HiveMarkerFaceProps) {
  const metrics = getHiveMarkerVisualMetrics(count);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!animate) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withTiming(metrics.pulseMaxScale, {
        duration: metrics.pulseDurationMs / 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [animate, metrics.pulseDurationMs, metrics.pulseMaxScale, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.shadow,
        pulseStyle,
        {
          width: metrics.markerSize,
          height: metrics.markerSize,
        },
      ]}
    >
      <LinearGradient
        colors={['#F5A623', '#FF8C00']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[
          styles.marker,
          {
            width: metrics.markerSize,
            height: metrics.markerSize,
            borderRadius: metrics.markerSize / 2,
          },
        ]}
      >
        <Hexagon color="#FFFFFF" fill="#FFFFFF" size={metrics.iconSize} strokeWidth={0} />
        <Text
          style={[
            styles.count,
            {
              fontSize: metrics.countFontSize,
              lineHeight: Math.round(metrics.countFontSize * 1.2),
            },
          ]}
        >
          {count}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

export function HiveMarkerFaceStatic({ count }: { count: number }) {
  const metrics = getHiveMarkerVisualMetrics(count);

  return (
    <View
      style={[
        styles.markerStatic,
        {
          width: metrics.markerSize,
          height: metrics.markerSize,
          borderRadius: metrics.markerSize / 2,
        },
      ]}
    >
      <Hexagon color="#FFFFFF" fill="#FFFFFF" size={metrics.iconSize} strokeWidth={0} />
      <Text
        style={[
          styles.count,
          {
            fontSize: metrics.countFontSize,
            lineHeight: Math.round(metrics.countFontSize * 1.2),
          },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.67,
    shadowRadius: 16,
  },
  marker: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  markerStatic: {
    backgroundColor: '#F5A623',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  count: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    includeFontPadding: false,
  },
});
