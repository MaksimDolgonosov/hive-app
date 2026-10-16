import { YandexMapView, type YandexMapViewProps, type YandexMapViewRef } from 'expo-yandex-mapkit';
import { forwardRef, useCallback, useEffect, useRef, useState, type ForwardedRef } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { markerIconScale } from '@/src/components/map/capture-svg-marker-icon';
import { UserLocationIconRaster } from '@/src/components/map/UserLocationIconRaster';
import { useAuthStore } from '@/src/stores/authStore';
import type { HiveMapType, MapRegion } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
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
  const avatarUrl = useAuthStore((state) => state.user?.avatarUrl ?? null);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const avatarUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;
  const [locationIconUri, setLocationIconUri] = useState<string | null>(null);

  useEffect(() => {
    setLocationIconUri(null);
  }, [avatarUri]);

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
      showUserPosition={showUserPosition}
      style={style}
      tiltGesturesEnabled={false}
      userLocationIcon={showUserPosition && locationIconUri ? { uri: locationIconUri } : undefined}
      userLocationIconScale={showUserPosition && locationIconUri ? markerIconScale() : undefined}
      zoomGesturesEnabled={zoomEnabled}
      onCameraPositionChanged={
        onRegionChange || onRegionChangeComplete ? handleCameraPositionChanged : undefined
      }
      onMapPress={onPress ? (event) => onPress(event.nativeEvent.point) : undefined}
      onMapReady={onMapReady}
    >
      {showUserPosition && avatarUri && !locationIconUri ? (
        <UserLocationIconRaster key={avatarUri} uri={avatarUri} onReady={setLocationIconUri} />
      ) : null}
      {children}
    </YandexMapView>
  );
});
