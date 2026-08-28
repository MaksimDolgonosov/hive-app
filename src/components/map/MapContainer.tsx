import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveCircle } from '@/src/components/map/HiveCircle';
import { HiveMarkerCapture } from '@/src/components/map/HiveMarkerCapture';
import { LocationAccessGate } from '@/src/components/map/LocationAccessGate';
import { MapLocationButton } from '@/src/components/map/MapLocationButton';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { HiveBottomSheet } from '@/src/components/ui/HiveBottomSheet';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useLocation } from '@/src/hooks/useLocation';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useMapStore } from '@/src/stores/mapStore';
import { useLocationStore } from '@/src/stores/locationStore';
import type { MapBounds, MapRegion } from '@/src/types';
import { isActiveHive } from '@/src/utils/hive';
import { DEFAULT_MAP_REGION, coordsToUserMapRegion, regionToBounds } from '@/src/utils/map';

import { StingMarker } from './StingMarker';

const REGION_DEBOUNCE_MS = 300;
const PUBLISH_FOCUS_DELTA = 0.008;

function toMapRegion(region: Region): MapRegion {
  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: region.latitudeDelta,
    longitudeDelta: region.longitudeDelta,
  };
}

export function MapContainer() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const hasCenteredOnUser = useRef(false);
  const hasRestoredCachedRegion = useRef(false);

  const { coords, status: locationStatus, requestPermission } = useLocation();
  const region = useMapStore((state) => state.region);
  const setRegion = useMapStore((state) => state.setRegion);
  const setSelectedStingId = useMapStore((state) => state.setSelectedStingId);
  const setSelectedHiveId = useMapStore((state) => state.setSelectedHiveId);
  const selectedHiveId = useMapStore((state) => state.selectedHiveId);
  const pendingMapFocus = useMapStore((state) => state.pendingMapFocus);
  const clearPendingMapFocus = useMapStore((state) => state.clearPendingMapFocus);

  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);
  const [hiveMarkerImages, setHiveMarkerImages] = useState<Record<string, string>>({});
  const [mapInteractionsEnabled, setMapInteractionsEnabled] = useState(true);

  const handleHiveMarkerCaptured = useCallback((hiveId: string, uri: string) => {
    setHiveMarkerImages((previous) => {
      if (previous[hiveId] === uri) {
        return previous;
      }

      return { ...previous, [hiveId]: uri };
    });
  }, []);

  const { data, isFetching, isError } = useStingsNearby(debouncedBounds);

  useEffect(() => {
    if (region || hasRestoredCachedRegion.current) {
      return;
    }

    const lastKnownCoords = useLocationStore.getState().lastKnownCoords;
    if (!lastKnownCoords) {
      return;
    }

    hasRestoredCachedRegion.current = true;
    setRegion(coordsToUserMapRegion(lastKnownCoords.latitude, lastKnownCoords.longitude));
  }, [region, setRegion]);

  useEffect(() => {
    if (!coords || hasCenteredOnUser.current) {
      return;
    }

    hasCenteredOnUser.current = true;
    const userRegion = coordsToUserMapRegion(coords.latitude, coords.longitude);
    setRegion(userRegion);
    mapRef.current?.animateToRegion(userRegion, 500);
  }, [coords, setRegion]);

  useEffect(() => {
    if (!region) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedBounds(regionToBounds(region));
    }, REGION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [region]);

  useEffect(() => {
    if (!pendingMapFocus) {
      return;
    }

    const focusRegion: MapRegion = {
      latitude: pendingMapFocus.lat,
      longitude: pendingMapFocus.lng,
      latitudeDelta: PUBLISH_FOCUS_DELTA,
      longitudeDelta: PUBLISH_FOCUS_DELTA,
    };

    setRegion(focusRegion);
    setDebouncedBounds(regionToBounds(focusRegion));
    mapRef.current?.animateToRegion(focusRegion, 450);

    if (pendingMapFocus.stingId) {
      setSelectedStingId(pendingMapFocus.stingId);
      setSelectedHiveId(null);
    } else if (pendingMapFocus.hiveId) {
      setSelectedHiveId(pendingMapFocus.hiveId);
      setSelectedStingId(null);
    }

    clearPendingMapFocus();
  }, [clearPendingMapFocus, pendingMapFocus, setRegion, setSelectedHiveId, setSelectedStingId]);

  function handleRegionChangeComplete(nextRegion: Region) {
    setRegion(toMapRegion(nextRegion));
  }

  function openSting(stingId: string) {
    setSelectedStingId(stingId);
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  function openHive(hiveId: string) {
    setSelectedHiveId(hiveId);
  }

  function closeHiveSheet() {
    setSelectedHiveId(null);

    if (Platform.OS === 'ios') {
      setMapInteractionsEnabled(false);
      requestAnimationFrame(() => {
        setMapInteractionsEnabled(true);
      });
    }
  }

  function centerOnUserLocation() {
    if (!coords) {
      return;
    }

    const userRegion = coordsToUserMapRegion(coords.latitude, coords.longitude);

    setRegion(userRegion);
    setDebouncedBounds(regionToBounds(userRegion));
    mapRef.current?.animateToRegion(userRegion, 500);
  }

  if (locationStatus !== 'granted') {
    return (
      <LocationAccessGate
        status={locationStatus}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  const initialRegion = region ?? DEFAULT_MAP_REGION;
  const activeHives = data?.hives.filter((hive) => isActiveHive(hive.activeStingsCount)) ?? [];
  const isEmpty =
    debouncedBounds !== null &&
    data !== undefined &&
    !isFetching &&
    !isError &&
    data.stings.length === 0 &&
    activeHives.length === 0;

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={styles.mapLayer}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled={mapInteractionsEnabled}
        zoomEnabled={mapInteractionsEnabled}
        rotateEnabled={mapInteractionsEnabled}
        pitchEnabled={mapInteractionsEnabled}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="light"
        {...(Platform.OS === 'android' ? { googleRenderer: 'LEGACY' as const } : {})}
      >
        {data?.stings.map((sting) => (
          <StingMarker key={sting.id} sting={sting} onPress={() => openSting(sting.id)} />
        ))}
        {data?.hives
          .filter((hive) => isActiveHive(hive.activeStingsCount))
          .map((hive) => (
            <HiveCircle
              key={hive.id}
              hive={hive}
              imageUri={hiveMarkerImages[hive.id]}
              onPress={() => openHive(hive.id)}
            />
          ))}
      </MapView>

      <View pointerEvents="box-none" style={styles.overlayLayer}>
        {Platform.OS === 'android' &&
          activeHives.map((hive) => (
            <HiveMarkerCapture
              key={`${hive.id}:${hive.activeStingsCount}`}
              count={hive.activeStingsCount}
              hiveId={hive.id}
              onCaptured={handleHiveMarkerCaptured}
            />
          ))}

        {isEmpty && (
          <View
            pointerEvents="none"
            className="absolute left-4 right-4 rounded-hive-md bg-hive-surface/95 px-4 py-3 shadow-sm"
            style={{ top: insets.top + 16 }}
          >
            <Text className="text-center font-inter text-sm font-semibold text-hive-foreground">
              {t('map.emptyTitle')}
            </Text>
            <Text className="mt-1 text-center font-inter text-xs text-hive-muted">
              {t('map.emptyMessage')}
            </Text>
          </View>
        )}

        {isFetching && (
          <View style={[styles.fetchingBadge, { top: insets.top + 56 }]}>
            <HiveLoader size="small" strokeWidth={3} />
          </View>
        )}

        {isError && (
          <View
            className="absolute left-4 right-4 rounded-hive-md bg-hive-surface px-4 py-3 shadow-sm"
            style={{ bottom: getGlassTabBarInset(insets.bottom) + 12 }}
          >
            <Text className="text-center font-inter text-sm text-hive-foreground">
              {t('map.loadError')}
            </Text>
          </View>
        )}

        <View style={[styles.locationButton, { bottom: getGlassTabBarInset(insets.bottom) + 12 }]}>
          <MapLocationButton disabled={!coords} onPress={centerOnUserLocation} />
        </View>
      </View>

      {selectedHiveId && <HiveBottomSheet hiveId={selectedHiveId} onClose={closeHiveSheet} />}
    </View>
  );
}

const styles = StyleSheet.create({
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'android'
      ? {
          zIndex: 2,
          elevation: 2,
        }
      : null),
  },
  fetchingBadge: {
    position: 'absolute',
    right: 16,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    ...(Platform.OS === 'android'
      ? {
          elevation: 24,
        }
      : null),
  },
});
