import { YandexMapView, type YandexMapViewProps, type YandexMapViewRef } from 'expo-yandex-mapkit';
import { forwardRef, useCallback, useRef, type ForwardedRef } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { UserLocationMarker } from '@/src/components/map/UserLocationMarker';
import type { HiveMapType, MapRegion } from '@/src/types';
import { cameraToRegion, visibleRegionToMapRegion, type MapCameraPosition } from '@/src/utils/map';

type HiveMapViewProps = {
  cameraPosition: MapCameraPosition;
  colorScheme: 'light' | 'dark';
  mapType?: HiveMapType;
  bottomInset?: number;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  showUserPosition?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: YandexMapViewProps['children'];
  onRegionChange?: (region: MapRegion) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  onMapReady?: () => void;
  onPress?: (point: { latitude: number; longitude: number }) => void;
};

function assignMapRef(ref: ForwardedRef<YandexMapViewRef>, instance: YandexMapViewRef | null) {
  if (typeof ref === 'function') {
    ref(instance);
    return;
  }

  if (ref) {
    ref.current = instance;
  }
}

export const HiveMapView = forwardRef<YandexMapViewRef, HiveMapViewProps>(function HiveMapView(
  {
    cameraPosition,
    colorScheme,
    mapType = 'standard',
    bottomInset = 0,
    scrollEnabled = true,
    zoomEnabled = true,
    showUserPosition = true,
    style,
    children,
    onRegionChange,
    onRegionChangeComplete,
    onMapReady,
    onPress,
  },
  ref,
) {
  const mapRef = useRef<YandexMapViewRef>(null);

  const handleCameraPositionChanged = useCallback(
    (event: { nativeEvent: { finished: boolean; cameraPosition: MapCameraPosition } }) => {
      // nativeEvent обнуляется после обработчика. Библиотечный onRegionChangeComplete
      // читает его уже внутри Promise и падает.
      const { finished, cameraPosition: nextCamera } = event.nativeEvent;
      const regionFromZoom = cameraToRegion(nextCamera);

      if (!finished) {
        onRegionChange?.(regionFromZoom);
        return;
      }

      const publish = (region: MapRegion) => {
        onRegionChangeComplete?.(region);
      };

      const visibleRegion = mapRef.current?.getVisibleRegion();
      if (!visibleRegion) {
        publish(regionFromZoom);
        return;
      }

      void visibleRegion
        .then((visible) => {
          if (!visible) {
            publish(regionFromZoom);
            return;
          }

          publish(
            visibleRegionToMapRegion(nextCamera, [
              visible.topLeft,
              visible.topRight,
              visible.bottomLeft,
              visible.bottomRight,
            ]),
          );
        })
        .catch(() => {
          publish(regionFromZoom);
        });
    },
    [onRegionChange, onRegionChangeComplete],
  );

  return (
    <YandexMapView
      ref={(instance) => {
        mapRef.current = instance;
        assignMapRef(ref, instance);
      }}
      animated={false}
      cameraPosition={cameraPosition}
      logoPadding={{ horizontal: 100, vertical: 20 }}
      logoPosition={{ horizontal: 'left', vertical: 'bottom' }}
      mapPadding={bottomInset > 0 ? { bottom: bottomInset } : undefined}
      mapType={mapType === 'satellite' ? 'hybrid' : 'vector'}
      nightMode={colorScheme === 'dark' && mapType !== 'satellite'}
      rotateGesturesEnabled={false}
      scrollGesturesEnabled={scrollEnabled}
      showUserPosition={false}
      style={style}
      tiltGesturesEnabled={false}
      zoomGesturesEnabled={zoomEnabled}
      onCameraPositionChanged={
        onRegionChange || onRegionChangeComplete ? handleCameraPositionChanged : undefined
      }
      onMapPress={onPress ? (event) => onPress(event.nativeEvent.point) : undefined}
      onMapReady={onMapReady}
    >
      {showUserPosition ? <UserLocationMarker /> : null}
      {children}
    </YandexMapView>
  );
});
