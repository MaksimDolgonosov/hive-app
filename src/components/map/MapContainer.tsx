import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveCircle } from '@/src/components/map/HiveCircle';
import { MapLocationButton } from '@/src/components/map/MapLocationButton';
import { HiveBottomSheet } from '@/src/components/ui/HiveBottomSheet';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { useLocation } from '@/src/hooks/useLocation';
import { useMapWebSocket } from '@/src/hooks/useMapWebSocket';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useMapStore } from '@/src/stores/mapStore';
import type { MapBounds, MapRegion } from '@/src/types';
import { DEFAULT_MAP_REGION, regionToBounds } from '@/src/utils/map';
import { isActiveHive } from '@/src/utils/hive';

import { StingMarker } from './StingMarker';

const REGION_DEBOUNCE_MS = 300;
const PUBLISH_FOCUS_DELTA = 0.008;
const USER_REGION_DELTA = 0.01;

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

  const { coords, status: locationStatus } = useLocation();
  const region = useMapStore((state) => state.region);
  const setRegion = useMapStore((state) => state.setRegion);
  const setSelectedStingId = useMapStore((state) => state.setSelectedStingId);
  const setSelectedHiveId = useMapStore((state) => state.setSelectedHiveId);
  const selectedHiveId = useMapStore((state) => state.selectedHiveId);
  const pendingMapFocus = useMapStore((state) => state.pendingMapFocus);
  const clearPendingMapFocus = useMapStore((state) => state.clearPendingMapFocus);

  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);

  const { data, isFetching, isError } = useStingsNearby(debouncedBounds);

  useMapWebSocket(debouncedBounds);

  useEffect(() => {
    if (!coords || hasCenteredOnUser.current) {
      return;
    }

    const userRegion: MapRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: USER_REGION_DELTA,
      longitudeDelta: USER_REGION_DELTA,
    };

    hasCenteredOnUser.current = true;
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
  }, [
    clearPendingMapFocus,
    pendingMapFocus,
    setRegion,
    setSelectedHiveId,
    setSelectedStingId,
  ]);

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
  }

  function centerOnUserLocation() {
    if (!coords) {
      return;
    }

    const userRegion: MapRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: USER_REGION_DELTA,
      longitudeDelta: USER_REGION_DELTA,
    };

    setRegion(userRegion);
    setDebouncedBounds(regionToBounds(userRegion));
    mapRef.current?.animateToRegion(userRegion, 500);
  }

  if (locationStatus === 'loading' || locationStatus === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg">
        <ActivityIndicator size="large" color="#F5A623" />
        <Text className="mt-3 font-inter text-sm text-hive-muted">{t('map.loadingLocation')}</Text>
      </View>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-8">
        <Text className="text-center font-inter text-lg font-semibold text-hive-foreground">
          {t('map.locationDeniedTitle')}
        </Text>
        <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
          {t('map.locationDeniedMessage')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-hive-md bg-hive-primary px-6 py-3"
          onPress={() => void Linking.openSettings()}
        >
          <Text className="font-inter text-base font-bold text-white">{t('map.openSettings')}</Text>
        </Pressable>
      </View>
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
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="light"
      >
        {data?.stings.map((sting) => (
          <StingMarker key={sting.id} sting={sting} onPress={() => openSting(sting.id)} />
        ))}
        {data?.hives.filter((hive) => isActiveHive(hive.activeStingsCount)).map((hive) => (
          <HiveCircle key={hive.id} hive={hive} onPress={() => openHive(hive.id)} />
        ))}
      </MapView>

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
        <View className="absolute right-4 top-14 rounded-full bg-hive-surface px-3 py-2 shadow-sm">
          <ActivityIndicator size="small" color="#F5A623" />
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

      <View
        className="absolute right-4"
        style={{ bottom: getGlassTabBarInset(insets.bottom) + 12 }}
      >
        <MapLocationButton disabled={!coords} onPress={centerOnUserLocation} />
      </View>

      {selectedHiveId && (
        <HiveBottomSheet hiveId={selectedHiveId} onClose={closeHiveSheet} />
      )}
    </View>
  );
}
