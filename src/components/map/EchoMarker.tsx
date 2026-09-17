import { useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { StingEchoCell } from '@/src/types';

const MAX_SIZE = 22;
const MIN_SIZE = 10;

type EchoMarkerProps = {
  echo: StingEchoCell;
  onPress: (echo: StingEchoCell) => void;
};

export function EchoMarker({ echo, onPress }: EchoMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const size = Math.min(MAX_SIZE, MIN_SIZE + echo.count * 2);

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={{ latitude: echo.center.lat, longitude: echo.center.lng }}
      tracksViewChanges={tracksViewChanges}
      onLayout={() => setTracksViewChanges(false)}
      onPress={() => onPress(echo)}
    >
      <View
        collapsable={false}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 184, 0, 0.35)',
          borderWidth: 1,
          borderColor: 'rgba(255, 184, 0, 0.45)',
        }}
      />
    </Marker>
  );
}
