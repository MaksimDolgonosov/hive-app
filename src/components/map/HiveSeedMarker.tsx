import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Marker } from 'expo-yandex-mapkit';

import { HiveMarkerFace } from '@/src/components/map/HiveMarkerFace';
import type { Hive } from '@/src/types';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

interface HiveSeedMarkerProps {
  hive: Hive;
  onPress?: () => void;
}

/**
 * Маркер «соты» (§G13): место, где уже есть фото, но тусовки ещё нет.
 * Отличается от тусовки приглушённым видом и отсутствием пульсации.
 */
export function HiveSeedMarker({ hive, onPress }: HiveSeedMarkerProps) {
  const metrics = getHiveMarkerVisualMetrics(hive.activeStingsCount);
  const coverUrl = hive.place?.coverThumbnailUrl;
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const point = {
    latitude: hive.center.lat,
    longitude: hive.center.lng,
  };

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), coverUrl ? 2000 : 400);
    return () => clearTimeout(timer);
  }, [coverUrl]);

  const handleCoverReady = useCallback(() => {
    setTracksViewChanges(true);
    setTimeout(() => setTracksViewChanges(false), 120);
  }, []);

  return (
    <>
      <Circle
        center={point}
        fillColor="rgba(185, 154, 85, 0.14)"
        radius={hive.radiusM}
        strokeColor="rgba(185, 154, 85, 0.3)"
        strokeWidth={1}
      />
      <Marker
        anchor={{ x: 0.5, y: 0.5 }}
        handled
        point={point}
        tracksViewChanges={tracksViewChanges}
        onPress={onPress}
      >
        <View
          collapsable={false}
          style={[styles.markerRoot, { width: metrics.markerSize, height: metrics.markerSize }]}
        >
          <HiveMarkerFace
            animate={false}
            count={hive.activeStingsCount}
            coverUrl={coverUrl}
            snapshotCover
            variant="seed"
            onCoverReady={handleCoverReady}
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
