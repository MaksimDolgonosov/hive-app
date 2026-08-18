import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react-native';
import { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import type { Sting } from '@/src/types';

const MARKER_SIZE = 36;
const ICON_SIZE = 16;
const PRIMARY = '#F5A623';
const SURFACE_STRONG = '#FFFFFFE6';

interface StingMarkerProps {
  sting: Sting;
  onPress?: () => void;
}

export function StingMarker({ sting, onPress }: StingMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: sting.location.lat,
        longitude: sting.location.lng,
      }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.shadow}>
        <View style={styles.marker}>
          <Camera color={PRIMARY} size={ICON_SIZE} strokeWidth={2} />
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: SURFACE_STRONG,
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
