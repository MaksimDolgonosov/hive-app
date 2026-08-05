import { Circle, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import type { Hive } from '@/src/types';

interface HiveCircleProps {
  hive: Hive;
  onPress?: () => void;
}

export function HiveCircle({ hive, onPress }: HiveCircleProps) {
  const markerSize = Math.min(28 + hive.activeStingsCount * 3, 44);

  return (
    <>
      <Circle
        center={{
          latitude: hive.center.lat,
          longitude: hive.center.lng,
        }}
        fillColor="rgba(245, 166, 35, 0.18)"
        radius={hive.radiusM}
        strokeColor="rgba(245, 166, 35, 0.55)"
        strokeWidth={2}
      />
      <Marker
        coordinate={{
          latitude: hive.center.lat,
          longitude: hive.center.lng,
        }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={[styles.marker, { width: markerSize, height: markerSize, borderRadius: markerSize / 2 }]}>
          <Text style={styles.count}>{hive.activeStingsCount}</Text>
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  count: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
  },
});
