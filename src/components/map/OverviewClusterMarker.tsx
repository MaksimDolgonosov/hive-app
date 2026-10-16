import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'expo-yandex-mapkit';

import type { MapOverviewCluster, MapRegion } from '@/src/types';

type OverviewClusterMarkerProps = {
  cluster: MapOverviewCluster;
  onPress: (region: MapRegion) => void;
};

export function OverviewClusterMarker({ cluster, onPress }: OverviewClusterMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const size = Math.min(64, 36 + Math.log2(Math.max(cluster.activeStingsCount, 1)) * 8);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, [cluster.cellId, cluster.activeStingsCount, size]);

  function handlePress() {
    const latitudeDelta = Math.max(0.04, (cluster.radiusM / 111_000) * 2.4);
    onPress({
      latitude: cluster.center.lat,
      longitude: cluster.center.lng,
      latitudeDelta,
      longitudeDelta: latitudeDelta,
    });
  }

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      handled
      point={{ latitude: cluster.center.lat, longitude: cluster.center.lng }}
      tracksViewChanges={tracksViewChanges}
      onPress={handlePress}
    >
      <View
        collapsable={false}
        className="items-center justify-center rounded-full bg-hive-primary"
        style={{ width: size, height: size }}
      >
        <Text className="font-semibold font-display text-[13px] text-hive-on-accent">
          {cluster.activeStingsCount}
        </Text>
        {cluster.label ? (
          <Text
            numberOfLines={1}
            className="max-w-[72px] px-1 font-inter-semibold text-[8px] text-hive-on-accent"
          >
            {cluster.label}
          </Text>
        ) : null}
      </View>
    </Marker>
  );
}
