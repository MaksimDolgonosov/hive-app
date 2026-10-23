import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';

import { captureSvgMarkerIcon } from '@/src/components/map/capture-svg-marker-icon';
import { HiveTheme } from '@/src/theme/tokens';
import { getRoundedHexagonPath } from '@/src/utils/hive-hexagon';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

export type HiveMarkerVariant = 'hive' | 'seed';

/** Приглушённая заливка соты — визуально отделяет «ещё не улей» от улья (§G13). */
export const SEED_FILL = '#B99A55';

type HiveMarkerFaceProps = {
  count: number;
  animate?: boolean;
  variant?: HiveMarkerVariant;
  coverUrl?: string | null;
  /** Снять обложку в PNG: view маркера MapKit не показывает сетевой SvgImage. */
  snapshotCover?: boolean;
  onCoverReady?: () => void;
};

function HiveHexagonMark({
  count,
  variant = 'hive',
  coverUrl,
  snapshotCover = false,
  onCoverReady,
}: {
  count: number;
  variant?: HiveMarkerVariant;
  coverUrl?: string | null;
  snapshotCover?: boolean;
  onCoverReady?: () => void;
}) {
  const clipId = useId().replace(/:/g, '');
  const svgRef = useRef<Svg>(null);
  const [iconUri, setIconUri] = useState<string | null>(null);
  const metrics = getHiveMarkerVisualMetrics(count);
  const path = useMemo(
    () => getRoundedHexagonPath(metrics.markerSize, metrics.cornerRadius, metrics.strokeWidth / 2),
    [metrics.cornerRadius, metrics.markerSize, metrics.strokeWidth],
  );
  const shouldSnapshot = snapshotCover && Boolean(coverUrl);

  useEffect(() => {
    setIconUri(null);
  }, [coverUrl, metrics.markerSize, variant]);

  useEffect(() => {
    if (!shouldSnapshot) {
      onCoverReady?.();
    }
  }, [onCoverReady, shouldSnapshot]);

  const handleImageLoad = () => {
    const svg = svgRef.current;
    if (!svg) {
      onCoverReady?.();
      return;
    }

    setTimeout(() => {
      if (svgRef.current !== svg) {
        return;
      }

      void captureSvgMarkerIcon(svg, metrics.markerSize).then((uri) => {
        if (svgRef.current !== svg) {
          return;
        }

        if (uri) {
          setIconUri(uri);
          return;
        }

        onCoverReady?.();
      });
    }, 50);
  };

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
      {shouldSnapshot && iconUri ? (
        <Image
          resizeMode="cover"
          source={{ uri: iconUri }}
          style={StyleSheet.absoluteFill}
          onLoad={onCoverReady}
        />
      ) : (
        <Svg
          ref={svgRef}
          height={metrics.markerSize}
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${metrics.markerSize} ${metrics.markerSize}`}
          width={metrics.markerSize}
        >
          {coverUrl ? (
            <>
              <Defs>
                <ClipPath id={clipId}>
                  <Path d={path} />
                </ClipPath>
              </Defs>
              <SvgImage
                clipPath={`url(#${clipId})`}
                height={metrics.markerSize}
                href={{ uri: coverUrl }}
                preserveAspectRatio="xMidYMid slice"
                width={metrics.markerSize}
                onLoad={shouldSnapshot ? handleImageLoad : undefined}
              />
              {variant === 'seed' ? <Path d={path} fill="rgba(40, 28, 8, 0.38)" /> : null}
              <Path
                d={path}
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeLinejoin="round"
                strokeWidth={metrics.strokeWidth}
              />
            </>
          ) : (
            <Path
              d={path}
              fill={variant === 'seed' ? SEED_FILL : HiveTheme.accent}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeLinejoin="round"
              strokeWidth={metrics.strokeWidth}
            />
          )}
        </Svg>
      )}
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

export function HiveMarkerFace({
  count,
  animate = true,
  variant = 'hive',
  coverUrl,
  snapshotCover = false,
  onCoverReady,
}: HiveMarkerFaceProps) {
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
      <HiveHexagonMark
        count={count}
        coverUrl={coverUrl}
        snapshotCover={snapshotCover}
        variant={variant}
        onCoverReady={onCoverReady}
      />
    </Animated.View>
  );
}

export function HiveMarkerFaceStatic({
  count,
  variant = 'hive',
  coverUrl,
}: {
  count: number;
  variant?: HiveMarkerVariant;
  coverUrl?: string | null;
}) {
  return <HiveHexagonMark count={count} coverUrl={coverUrl} variant={variant} />;
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
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
