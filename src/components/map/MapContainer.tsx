import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveCircle } from '@/src/components/map/HiveCircle';
import { HiveMarkerCapture } from '@/src/components/map/HiveMarkerCapture';
import { LocationAccessGate } from '@/src/components/map/LocationAccessGate';
import { MapBookmarkButton } from '@/src/components/map/MapBookmarkButton';
import { MapLocationButton } from '@/src/components/map/MapLocationButton';
import { SaveMapPlaceModal } from '@/src/components/map/SaveMapPlaceModal';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { HiveBottomSheet } from '@/src/components/ui/HiveBottomSheet';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useLocation } from '@/src/hooks/useLocation';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useMapStore } from '@/src/stores/mapStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';
import type { MapBounds, MapRegion } from '@/src/types';
import { SAVED_MAP_PLACES_MAX } from '@/src/types';
import { isActiveHive } from '@/src/utils/hive';
import { DEFAULT_MAP_REGION, coordsToUserMapRegion, regionToBounds } from '@/src/utils/map';
import { resolveMapViewRegion } from '@/src/utils/resolve-map-view-region';
import { showInfoToast, showErrorToast } from '@/src/stores/toastStore';
import { showMessageToast } from '@/src/utils/show-toast';

import { StingMarker } from './StingMarker';

const REGION_DEBOUNCE_MS = 300;
const PUBLISH_FOCUS_DELTA = 0.008;
const EMPTY_BANNER_HEIGHT = 72;

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
  const liveRegionRef = useRef<MapRegion | null>(null);
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
  const pendingSavedRegion = useMapStore((state) => state.pendingSavedRegion);
  const clearPendingSavedRegion = useMapStore((state) => state.clearPendingSavedRegion);

  const savedPlaces = useSavedMapPlacesStore((state) => state.places);
  const addSavedPlace = useSavedMapPlacesStore((state) => state.addPlace);

  const [savePlaceModalVisible, setSavePlaceModalVisible] = useState(false);
  const [draftRegion, setDraftRegion] = useState<MapRegion | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);
  const [hiveMarkerImages, setHiveMarkerImages] = useState<Record<string, string>>({});
  const [mapInteractionsEnabled, setMapInteractionsEnabled] = useState(true);
  const [viewRegion, setViewRegion] = useState<MapRegion>(
    () => useMapStore.getState().pendingSavedRegion ?? useMapStore.getState().region ?? DEFAULT_MAP_REGION,
  );

  const applyMapRegion = useCallback(
    (nextRegion: MapRegion, options?: { syncStore?: boolean; updateView?: boolean }) => {
      const syncStore = options?.syncStore ?? true;
      const updateView = options?.updateView ?? true;

      liveRegionRef.current = nextRegion;
      if (updateView) {
        setViewRegion(nextRegion);
      }
      if (syncStore) {
        setRegion(nextRegion);
      }
    },
    [setRegion],
  );

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
    applyMapRegion(coordsToUserMapRegion(lastKnownCoords.latitude, lastKnownCoords.longitude));
  }, [applyMapRegion, region, setRegion]);

  useEffect(() => {
    if (!coords || hasCenteredOnUser.current) {
      return;
    }

    if (useMapStore.getState().pendingSavedRegion) {
      hasCenteredOnUser.current = true;
      return;
    }

    hasCenteredOnUser.current = true;
    const userRegion = coordsToUserMapRegion(coords.latitude, coords.longitude);
    applyMapRegion(userRegion);
    mapRef.current?.animateToRegion(userRegion, 500);
  }, [applyMapRegion, coords]);

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

    applyMapRegion(focusRegion);
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
  }, [applyMapRegion, clearPendingMapFocus, pendingMapFocus, setSelectedHiveId, setSelectedStingId]);

  useEffect(() => {
    if (!pendingSavedRegion) {
      return;
    }

    hasCenteredOnUser.current = true;
    applyMapRegion(pendingSavedRegion);
    setDebouncedBounds(regionToBounds(pendingSavedRegion));
    setSelectedStingId(null);
    setSelectedHiveId(null);

    const targetRegion = pendingSavedRegion;
    const animate = () => {
      mapRef.current?.animateToRegion(targetRegion, 500);
    };

    animate();
    const retryTimer = setTimeout(animate, 200);
    clearPendingSavedRegion();

    return () => {
      clearTimeout(retryTimer);
    };
  }, [
    applyMapRegion,
    clearPendingSavedRegion,
    pendingSavedRegion,
    setSelectedHiveId,
    setSelectedStingId,
  ]);

  function handleRegionChange(nextRegion: Region, details?: { isGesture?: boolean }) {
    const mapped = toMapRegion(nextRegion);
    liveRegionRef.current = mapped;

    if (details?.isGesture ?? true) {
      setViewRegion(mapped);
    }
  }

  function handleRegionChangeComplete(nextRegion: Region) {
    const mapped = toMapRegion(nextRegion);
    applyMapRegion(mapped);
  }

  async function readVisibleMapRegion(): Promise<MapRegion | null> {
    const fallback = liveRegionRef.current ?? viewRegion ?? region ?? DEFAULT_MAP_REGION;
    const resolved = await resolveMapViewRegion(mapRef, fallback);
    if (resolved) {
      liveRegionRef.current = resolved;
    }
    return resolved;
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

    applyMapRegion(userRegion);
    setDebouncedBounds(regionToBounds(userRegion));
    mapRef.current?.animateToRegion(userRegion, 500);
  }

  async function openSavePlaceModal() {
    const currentRegion = await readVisibleMapRegion();
    if (!currentRegion) {
      showMessageToast('map.savePlaceRegionUnavailable');
      return;
    }

    if (savedPlaces.length >= SAVED_MAP_PLACES_MAX) {
      showErrorToast({
        message: t('map.savePlaceLimitReached', { max: SAVED_MAP_PLACES_MAX }),
      });
      return;
    }

    setDraftRegion(currentRegion);
    setSavePlaceModalVisible(true);
  }

  function closeSavePlaceModal() {
    if (isSavingPlace) {
      return;
    }

    setSavePlaceModalVisible(false);
    setDraftRegion(null);
  }

  async function handleSavePlace(name: string) {
    if (isSavingPlace) {
      return;
    }

    setIsSavingPlace(true);

    try {
      const regionToSave = (await readVisibleMapRegion()) ?? draftRegion;
      if (!regionToSave) {
        showMessageToast('map.savePlaceFailed');
        return;
      }

      const saved = await addSavedPlace({ name, region: regionToSave });
      if (!saved) {
        showMessageToast('map.savePlaceFailed');
        return;
      }

      setSavePlaceModalVisible(false);
      setDraftRegion(null);
      showInfoToast({ message: t('map.savePlaceSuccess') });
    } finally {
      setIsSavingPlace(false);
    }
  }

  const savePlaceDefaultName = t('map.savePlaceDefaultName', {
    index: savedPlaces.length + 1,
  });

  if (locationStatus !== 'granted') {
    return (
      <LocationAccessGate
        status={locationStatus}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  const activeHives = data?.hives.filter((hive) => isActiveHive(hive.activeStingsCount)) ?? [];
  const isEmpty =
    debouncedBounds !== null &&
    data !== undefined &&
    !isFetching &&
    !isError &&
    data.stings.length === 0 &&
    activeHives.length === 0;

  const emptyBannerTop = insets.top + 16;
  const bookmarkTop = emptyBannerTop + EMPTY_BANNER_HEIGHT + 12;

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={styles.mapLayer}
        region={viewRegion}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => {
          void readVisibleMapRegion();
        }}
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
            style={{ top: emptyBannerTop }}
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
          <View style={[styles.fetchingBadge, { top: bookmarkTop }]}>
            <HiveLoader size="small" strokeWidth={3} />
          </View>
        )}

        <View style={[styles.bookmarkButton, { top: bookmarkTop }]}>
          <MapBookmarkButton onPress={() => void openSavePlaceModal()} />
        </View>

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

      <SaveMapPlaceModal
        initialName={savePlaceDefaultName}
        saving={isSavingPlace}
        visible={savePlaceModalVisible}
        onClose={closeSavePlaceModal}
        onSave={(name) => void handleSavePlace(name)}
      />
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
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  bookmarkButton: {
    position: 'absolute',
    left: 16,
    ...(Platform.OS === 'android'
      ? {
          elevation: 24,
        }
      : null),
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
