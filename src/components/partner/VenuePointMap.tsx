import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, type YandexMapViewRef } from 'expo-yandex-mapkit';

import { HiveMapView } from '@/src/components/map/HiveMapView';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';
import type { GeoPoint } from '@/src/types';
import { regionToCamera } from '@/src/utils/map';

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
  const mapRef = useRef<YandexMapViewRef>(null);
  const [ready, setReady] = useState(false);
  const movedToCamera = useRef(false);
  const center = point ?? camera ?? { lat: 55.751244, lng: 37.618423 };
  const [initialCamera] = useState(() =>
    regionToCamera({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: DELTA,
      longitudeDelta: DELTA,
    }),
  );

  useEffect(() => {
    if (!ready || point || !camera || movedToCamera.current) {
      return;
    }

    movedToCamera.current = true;
    void mapRef.current?.setCenter(
      regionToCamera({
        latitude: camera.lat,
        longitude: camera.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }),
      { durationSeconds: 0.25, animation: 'smooth' },
    );
  }, [camera, point, ready]);

  useEffect(() => {
    if (!ready || !point) {
      return;
    }

    void mapRef.current?.setCenter(
      regionToCamera({
        latitude: point.lat,
        longitude: point.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }),
      { durationSeconds: 0.25, animation: 'smooth' },
    );
  }, [point, ready]);

  function select(latitude: number, longitude: number) {
    if (!editable || !onChange) {
      return;
    }

    onChange({ lat: latitude, lng: longitude });
  }

  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={styles.frame}
      onTouchCancel={() => onInteractionChange?.(false)}
      onTouchEnd={() => onInteractionChange?.(false)}
      onTouchStart={() => onInteractionChange?.(true)}
    >
      <HiveMapView
        ref={mapRef}
        cameraPosition={initialCamera}
        colorScheme={colorScheme}
        scrollEnabled={editable}
        showUserPosition
        style={styles.map}
        zoomEnabled={editable}
        onMapReady={() => setReady(true)}
        onPress={editable ? (next) => select(next.latitude, next.longitude) : undefined}
      >
        {point ? (
          <Marker
            anchor={{ x: 0.5, y: 0.5 }}
            draggable={editable}
            handled
            point={{ latitude: point.lat, longitude: point.lng }}
            onDragEnd={
              editable
                ? (event) =>
                    select(event.nativeEvent.point.latitude, event.nativeEvent.point.longitude)
                : undefined
            }
          >
            <View style={styles.pin} />
          </Marker>
        ) : null}
      </HiveMapView>
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
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFB800',
    borderWidth: 2,
    borderColor: '#201C16',
  },
});
