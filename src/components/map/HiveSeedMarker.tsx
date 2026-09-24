import { Platform, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Circle, Marker } from 'react-native-maps';

import { HiveMarkerFace } from '@/src/components/map/HiveMarkerFace';
import type { Hive } from '@/src/types';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

interface HiveSeedMarkerProps {
  hive: Hive;
  imageUri?: string | null;
  onPress?: () => void;
}

/**
 * Маркер «соты» (§G13): место, где уже есть фото, но улья ещё нет.
 * Отличается от улья приглушённым видом и отсутствием пульсации.
 */
export function HiveSeedMarker({ hive, imageUri, onPress }: HiveSeedMarkerProps) {
  const metrics = getHiveMarkerVisualMetrics(hive.activeStingsCount);
  const coverUrl = hive.place?.coverThumbnailUrl;
  const [tracksViewChanges, setTracksViewChanges] = useState(Boolean(coverUrl));

  useEffect(() => {
    if (!coverUrl) {
      return;
    }
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, [coverUrl]);

  const coordinate = {
    latitude: hive.center.lat,
    longitude: hive.center.lng,
  };

  return (
    <>
      <Circle
        center={coordinate}
        fillColor="rgba(185, 154, 85, 0.14)"
        radius={hive.radiusM}
        strokeColor="rgba(185, 154, 85, 0.3)"
        strokeWidth={1}
      />
      {Platform.OS === 'android' && !coverUrl ? (
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
          tracksViewChanges={tracksViewChanges}
          onPress={onPress}
        >
          <View
            collapsable={false}
            style={[styles.markerRoot, { width: metrics.markerSize, height: metrics.markerSize }]}
          >
            <HiveMarkerFace animate={false} count={hive.activeStingsCount} coverUrl={hive.place?.coverThumbnailUrl} variant="seed" />
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
