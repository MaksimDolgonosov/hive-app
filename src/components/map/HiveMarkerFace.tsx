import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { HiveTheme } from '@/src/theme/tokens';
import { getRoundedHexagonPath } from '@/src/utils/hive-hexagon';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

type HiveMarkerFaceProps = {
  count: number;
  animate?: boolean;
};

function HiveHexagonMark({ count }: { count: number }) {
  const metrics = getHiveMarkerVisualMetrics(count);
  const path = useMemo(
    () =>
      getRoundedHexagonPath(metrics.markerSize, metrics.cornerRadius, metrics.strokeWidth / 2),
    [metrics.cornerRadius, metrics.markerSize, metrics.strokeWidth],
  );

  return (
    <View
      style={[
        styles.mark,
        {
          width: metrics.markerSize,
          height: metrics.markerSize,
        },
      ]}
    >
      <Svg height={metrics.markerSize} width={metrics.markerSize} style={StyleSheet.absoluteFill}>
        <Path
          d={path}
          fill={HiveTheme.accent}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeLinejoin="round"
          strokeWidth={metrics.strokeWidth}
        />
      </Svg>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          styles.count,
          { fontSize: metrics.countFontSize },
          Platform.OS === 'ios' ? { lineHeight: metrics.markerSize } : null,
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

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
      <HiveHexagonMark count={count} />
    </Animated.View>
  );
}

export function HiveMarkerFaceStatic({ count }: { count: number }) {
  return <HiveHexagonMark count={count} />;
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: HiveTheme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...StyleSheet.absoluteFillObject,
    color: HiveTheme.textOnAccent,
    fontFamily: HiveTheme.fontDisplay,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
