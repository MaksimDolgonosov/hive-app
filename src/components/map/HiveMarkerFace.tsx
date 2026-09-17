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

export type HiveMarkerVariant = 'hive' | 'seed';

/** Приглушённая заливка соты — визуально отделяет «ещё не улей» от улья (§G13). */
const SEED_FILL = '#B99A55';

type HiveMarkerFaceProps = {
  count: number;
  animate?: boolean;
  variant?: HiveMarkerVariant;
};

function HiveHexagonMark({
  count,
  variant = 'hive',
}: {
  count: number;
  variant?: HiveMarkerVariant;
}) {
  const metrics = getHiveMarkerVisualMetrics(count);
  const path = useMemo(
    () => getRoundedHexagonPath(metrics.markerSize, metrics.cornerRadius, metrics.strokeWidth / 2),
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
          fill={variant === 'seed' ? SEED_FILL : HiveTheme.accent}
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

export function HiveMarkerFace({ count, animate = true, variant = 'hive' }: HiveMarkerFaceProps) {
  const metrics = getHiveMarkerVisualMetrics(count);
  const pulse = useSharedValue(1);
  // Сота не пульсирует: пульсация — признак живого улья (§G13).
  const shouldAnimate = animate && variant !== 'seed';

  useEffect(() => {
    if (!shouldAnimate) {
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
  }, [shouldAnimate, metrics.pulseDurationMs, metrics.pulseMaxScale, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        variant === 'seed' ? styles.seedShadow : styles.shadow,
        pulseStyle,
        {
          width: metrics.markerSize,
          height: metrics.markerSize,
        },
      ]}
    >
      <HiveHexagonMark count={count} variant={variant} />
    </Animated.View>
  );
}

export function HiveMarkerFaceStatic({
  count,
  variant = 'hive',
}: {
  count: number;
  variant?: HiveMarkerVariant;
}) {
  return <HiveHexagonMark count={count} variant={variant} />;
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: HiveTheme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  seedShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
