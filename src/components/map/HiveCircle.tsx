import { LinearGradient } from 'expo-linear-gradient';
import { Hexagon } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';

import { useMapMarkerTracking } from '@/src/hooks/useMapMarkerTracking';
import type { Hive } from '@/src/types';

const MARKER_SIZE = 52;
const ICON_SIZE = 18;

interface HiveCircleProps {
  hive: Hive;
  imageUri?: string | null;
  onPress?: () => void;
}

function IosHiveMarkerFace({ count }: { count: number }) {
  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={['#F5A623', '#FF8C00']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.marker}
      >
        <Hexagon color="#FFFFFF" fill="#FFFFFF" size={ICON_SIZE} strokeWidth={0} />
        <Text style={styles.count}>{count}</Text>
      </LinearGradient>
    </View>
  );
}

export function HiveCircle({ hive, imageUri, onPress }: HiveCircleProps) {
  const { tracksViewChanges, handleLayout } = useMapMarkerTracking(
    `${hive.id}:${hive.activeStingsCount}`,
  );

  const coordinate = {
    latitude: hive.center.lat,
    longitude: hive.center.lng,
  };

  return (
    <>
      <Circle
        center={coordinate}
        fillColor="rgba(168, 200, 152, 0.28)"
        radius={hive.radiusM}
        strokeColor="rgba(255, 255, 255, 0.4)"
        strokeWidth={1}
      />
      {Platform.OS === 'android' ? (
        imageUri ? (
          <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            image={{ uri: imageUri, width: MARKER_SIZE, height: MARKER_SIZE }}
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
          <View collapsable={false} style={styles.markerRoot} onLayout={handleLayout}>
            <IosHiveMarkerFace count={hive.activeStingsCount} />
          </View>
        </Marker>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  markerRoot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.67,
    shadowRadius: 16,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  count: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
  },
});
