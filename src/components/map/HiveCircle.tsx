import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';

import { HiveMarkerFace } from '@/src/components/map/HiveMarkerFace';
import type { Hive } from '@/src/types';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

interface HiveCircleProps {
  hive: Hive;
  imageUri?: string | null;
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

export function HiveCircle({ hive, imageUri, onPress }: HiveCircleProps) {
  const metrics = getHiveMarkerVisualMetrics(hive.activeStingsCount);
  const circleFillOpacity = useCircleFillOpacity(hive.activeStingsCount);

  const coordinate = {
    latitude: hive.center.lat,
    longitude: hive.center.lng,
  };

  return (
    <>
      <Circle
        center={coordinate}
        fillColor={`rgba(255, 184, 0, ${circleFillOpacity * 0.45})`}
        radius={hive.radiusM}
        strokeColor="rgba(255, 184, 0, 0.35)"
        strokeWidth={1}
      />
      {Platform.OS === 'android' ? (
        imageUri ? (
          <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            image={{ uri: imageUri, width: metrics.markerSize, height: metrics.markerSize }}
            tracksViewChanges={false}
            onPress={onPress}
          />
        ) : null
      ) : (
        <Marker
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
          onPress={onPress}
        >
          <View
            collapsable={false}
            style={[
              styles.markerRoot,
              {
                width: metrics.markerSize,
                height: metrics.markerSize,
                borderRadius: metrics.markerSize / 2,
              },
            ]}
          >
            <HiveMarkerFace count={hive.activeStingsCount} />
          </View>
        </Marker>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  markerRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
