import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { isGoogleMapsConfigured } from '@/src/config/env';
import { HIVE_DARK_MAP_STYLE, HIVE_LIGHT_MAP_STYLE } from '@/src/constants/map-style';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';
import type { GeoPoint } from '@/src/types';

const DELTA = 0.012;

type VenuePointMapProps = {
  point: GeoPoint | null;
  camera: GeoPoint | null;
  onChange?: (point: GeoPoint) => void;
  editable?: boolean;
  onInteractionChange?: (active: boolean) => void;
};

export function VenuePointMap({
  point,
  camera,
  onChange,
  editable = true,
  onInteractionChange,
}: VenuePointMapProps) {
  const colorScheme = useAppColorScheme();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const movedToCamera = useRef(false);
  const center = point ?? camera ?? { lat: 55.751244, lng: 37.618423 };

  useEffect(() => {
    if (!ready || point || !camera || movedToCamera.current) {
      return;
    }
    movedToCamera.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: camera.lat,
        longitude: camera.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      250,
    );
  }, [camera, point, ready]);

  useEffect(() => {
    if (!ready || !point) {
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: point.lat,
        longitude: point.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      250,
    );
  }, [point, ready]);

  function select(event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    if (!editable || !onChange) {
      return;
    }
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onChange({ lat: latitude, lng: longitude });
  }

  if (!isGoogleMapsConfigured()) {
    return null;
  }

  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={styles.frame}
      onTouchCancel={() => onInteractionChange?.(false)}
      onTouchEnd={() => onInteractionChange?.(false)}
      onTouchStart={() => onInteractionChange?.(true)}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        userInterfaceStyle={colorScheme}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
        customMapStyle={colorScheme === 'dark' ? HIVE_DARK_MAP_STYLE : HIVE_LIGHT_MAP_STYLE}
        onMapReady={() => setReady(true)}
        scrollEnabled={editable}
        zoomEnabled={editable}
        rotateEnabled={editable}
        pitchEnabled={editable}
        onPress={editable ? select : undefined}
        {...(Platform.OS === 'android' ? { googleRenderer: 'LEGACY' as const } : {})}
      >
        {point ? (
          <Marker
            coordinate={{ latitude: point.lat, longitude: point.lng }}
            draggable={editable}
            pinColor="#FFB800"
            onDragEnd={editable ? select : undefined}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 240,
  },
  map: {
    flex: 1,
  },
});
