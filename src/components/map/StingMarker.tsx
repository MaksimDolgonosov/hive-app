import { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import type { Sting } from '@/src/types';

interface StingMarkerProps {
  sting: Sting;
  onPress?: () => void;
}

export function StingMarker({ sting, onPress }: StingMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: sting.location.lat,
        longitude: sting.location.lng,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.marker} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F5A623',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
