import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Marker } from 'expo-yandex-mapkit';

import { HiveMarkerFace } from '@/src/components/map/HiveMarkerFace';
import type { Hive } from '@/src/types';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

interface HiveCircleProps {
  hive: Hive;
  onPress?: () => void;
}

function useCircleFillOpacity(activeStingsCount: number): number {
  const metrics = getHiveMarkerVisualMetrics(activeStingsCount);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((current) => 1 - current);
    }, metrics.pulseDurationMs / 2);

    return () => clearInterval(interval);
  }, [activeStingsCount, metrics.pulseDurationMs]);

  return (
    metrics.circleFillOpacityMin +
    phase * (metrics.circleFillOpacityMax - metrics.circleFillOpacityMin)
  );
}

export function HiveCircle({ hive, onPress }: HiveCircleProps) {
  const metrics = getHiveMarkerVisualMetrics(hive.activeStingsCount);
  const circleFillOpacity = useCircleFillOpacity(hive.activeStingsCount);
  const point = {
    latitude: hive.center.lat,
    longitude: hive.center.lng,
  };

  return (
    <>
      <Circle
        center={point}
        fillColor={`rgba(255, 184, 0, ${circleFillOpacity * 0.45})`}
        radius={hive.radiusM}
        strokeColor="rgba(255, 184, 0, 0.35)"
        strokeWidth={1}
      />
      <Marker anchor={{ x: 0.5, y: 0.5 }} handled point={point} tracksViewChanges onPress={onPress}>
        <View
          collapsable={false}
          style={[
            styles.markerRoot,
            {
              width: metrics.markerSize,
              height: metrics.markerSize,
            },
          ]}
        >
          <HiveMarkerFace
            count={hive.activeStingsCount}
            coverUrl={hive.place?.coverThumbnailUrl}
            snapshotCover
          />
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  markerRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
