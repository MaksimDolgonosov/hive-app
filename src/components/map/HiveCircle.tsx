import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Hexagon } from 'lucide-react-native';
import { Circle, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import type { Hive } from '@/src/types';

const MARKER_SIZE = 52;
const ICON_SIZE = 20;

interface HiveCircleProps {
  hive: Hive;
  onPress?: () => void;
}

export function HiveCircle({ hive, onPress }: HiveCircleProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Circle
        center={{
          latitude: hive.center.lat,
          longitude: hive.center.lng,
        }}
        fillColor="rgba(168, 200, 152, 0.28)"
        radius={hive.radiusM}
        strokeColor="rgba(255, 255, 255, 0.4)"
        strokeWidth={1}
      />
      <Marker
        coordinate={{
          latitude: hive.center.lat,
          longitude: hive.center.lng,
        }}
        onPress={onPress}
        tracksViewChanges={tracksViewChanges}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.shadow}>
          <LinearGradient
            colors={['#F5A623', '#FF8C00']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.marker}
          >
            <Hexagon color="#FFFFFF" fill="#FFFFFF" size={ICON_SIZE} strokeWidth={0} />
            <Text style={styles.count}>{hive.activeStingsCount}</Text>
          </LinearGradient>
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.67,
    shadowRadius: 16,
    elevation: 6,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  count: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
