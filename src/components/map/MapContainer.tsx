import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampaignBanner, pickSoonestCampaign } from '@/src/components/map/CampaignBanner';
import { EchoMarker } from '@/src/components/map/EchoMarker';
import { HiveCircle } from '@/src/components/map/HiveCircle';
import { HiveMarkerCapture } from '@/src/components/map/HiveMarkerCapture';
import { HiveSeedMarker } from '@/src/components/map/HiveSeedMarker';
import { LocationAccessGate } from '@/src/components/map/LocationAccessGate';
import { MapBookmarkButton } from '@/src/components/map/MapBookmarkButton';
import { MapEmptyState } from '@/src/components/map/MapEmptyState';
import { MapFilterChips } from '@/src/components/map/MapFilterChips';
import { MapLocationButton } from '@/src/components/map/MapLocationButton';
import { MapTypeButton } from '@/src/components/map/MapTypeButton';
import { OverviewClusterMarker } from '@/src/components/map/OverviewClusterMarker';
import { SaveMapPlaceModal } from '@/src/components/map/SaveMapPlaceModal';
import { WaitlistContent } from '@/src/components/growth/WaitlistContent';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { isGoogleMapsConfigured } from '@/src/config/env';
import { HIVE_DARK_MAP_STYLE, HIVE_LIGHT_MAP_STYLE } from '@/src/constants/map-style';
import * as zonesApi from '@/src/api/zones';
import { useActiveCampaigns } from '@/src/hooks/useActiveCampaigns';
import { useFilteredMapMarkers } from '@/src/hooks/useFilteredMapMarkers';
import { useLocation } from '@/src/hooks/useLocation';
import { useAppColorScheme } from '@/src/hooks/useHiveTheme';
import { useMapOverview } from '@/src/hooks/useMapOverview';
import { useNearestSting } from '@/src/hooks/useNearestSting';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useZoneStatus } from '@/src/hooks/useZoneStatus';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';
import { showErrorToast, showInfoToast } from '@/src/stores/toastStore';
import type { MapBounds, MapRegion, StingEchoCell } from '@/src/types';
import { SAVED_MAP_PLACES_MAX } from '@/src/types';
import { trackEvent, trackSessionStartOnce } from '@/src/utils/analytics-queue';
import { getApiErrorCode } from '@/src/utils/api-error';
import { formatDistance, isPointInBounds } from '@/src/utils/geo';
import { isActiveHive, isSeedHive } from '@/src/utils/hive';
import {
  coordsToUserMapRegion,
  DEFAULT_MAP_REGION,
  isDefaultMapRegion,
  OVERVIEW_ENTER_DELTA,
  OVERVIEW_EXIT_DELTA,
  regionToBounds,
} from '@/src/utils/map';
import { openHive } from '@/src/utils/open-hive';
import { resolveMapViewRegion } from '@/src/utils/resolve-map-view-region';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';

import { StingMarker, StingMarkerCapture } from './StingMarker';

const REGION_DEBOUNCE_MS = 300;
const PUBLISH_FOCUS_DELTA = 0.008;
const MAX_ECHO_MARKERS = 300;
const FILTER_CHIPS_HEIGHT = 40;

function resolveStartupRegion(): MapRegion | null {
  const pendingSaved = useMapStore.getState().pendingSavedRegion;
  if (pendingSaved) {
    return pendingSaved;
  }

  const stored = useMapStore.getState().region;
  if (stored && !isDefaultMapRegion(stored)) {
    return stored;
  }

  const lastKnown = useLocationStore.getState().lastKnownCoords;
  if (lastKnown) {
    return coordsToUserMapRegion(lastKnown.latitude, lastKnown.longitude);
  }

  return null;
}

function shouldCenterOnUserAtStartup(): boolean {
  const { pendingSavedRegion, region } = useMapStore.getState();

  if (pendingSavedRegion) {
    return false;
  }

  return !region || isDefaultMapRegion(region);
}

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
  const colorScheme = useAppColorScheme();
  const mapRef = useRef<MapView>(null);
  const liveRegionRef = useRef<MapRegion | null>(null);
  const hasCenteredOnUser = useRef(false);
  const hasRestoredCachedRegion = useRef(false);
  const hasRecoveredFromDefaultRegion = useRef(false);
  const emptyShownRef = useRef(false);
  const [isOverview, setIsOverview] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const { coords, status: locationStatus, requestPermission } = useLocation();
  const region = useMapStore((state) => state.region);
  const setRegion = useMapStore((state) => state.setRegion);
  const setSelectedStingId = useMapStore((state) => state.setSelectedStingId);
  const pendingMapFocus = useMapStore((state) => state.pendingMapFocus);
  const clearPendingMapFocus = useMapStore((state) => state.clearPendingMapFocus);
  const pendingSavedRegion = useMapStore((state) => state.pendingSavedRegion);
  const clearPendingSavedRegion = useMapStore((state) => state.clearPendingSavedRegion);
  const mapType = useMapStore((state) => state.mapType);
  const setMapType = useMapStore((state) => state.setMapType);
  const hydrateMapType = useMapStore((state) => state.hydrateMapType);
  const mapFilter = useMapStore((state) => state.mapFilter);
  const setMapFilter = useMapStore((state) => state.setMapFilter);
  const pendingCampaignId = useMapStore((state) => state.pendingCampaignId);
  const setPendingCampaignId = useMapStore((state) => state.setPendingCampaignId);
  const echoLayerEnabled = usePreferencesStore((state) => state.echoLayerEnabled);
  const user = useAuthStore((state) => state.user);

  const savedPlaces = useSavedMapPlacesStore((state) => state.places);
  const addSavedPlace = useSavedMapPlacesStore((state) => state.addPlace);

  const [savePlaceModalVisible, setSavePlaceModalVisible] = useState(false);
  const [draftRegion, setDraftRegion] = useState<MapRegion | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);
  const [hiveMarkerImages, setHiveMarkerImages] = useState<Record<string, string>>({});
  const [stingMarkerImages, setStingMarkerImages] = useState<Record<string, string>>({});
  const [initialRegion, setInitialRegion] = useState<MapRegion | null>(resolveStartupRegion);
  const [centerOnUserAtStartup] = useState(shouldCenterOnUserAtStartup);

  const zoneCoords = coords
    ? { lat: coords.latitude, lng: coords.longitude }
    : region
      ? { lat: region.latitude, lng: region.longitude }
      : null;
  const zoneQuery = useZoneStatus(zoneCoords);
  const campaignsQuery = useActiveCampaigns(zoneCoords);
  const activeCampaign = pickSoonestCampaign(campaignsQuery.data?.campaigns);

  const applyMapRegion = useCallback(
    (nextRegion: MapRegion, options?: { syncStore?: boolean; programmatic?: boolean }) => {
      const syncStore = options?.syncStore ?? true;

      liveRegionRef.current = nextRegion;
      if (syncStore) {
        setRegion(nextRegion);
      }

      setInitialRegion((current) => current ?? nextRegion);

      if (options?.programmatic) {
        mapRef.current?.animateToRegion(nextRegion, 500);
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

  const handleStingMarkerCaptured = useCallback((stingId: string, uri: string) => {
    setStingMarkerImages((previous) => {
      if (previous[stingId] === uri) {
        return previous;
      }

      return { ...previous, [stingId]: uri };
    });
  }, []);

  const { data, isFetching, isError } = useStingsNearby(debouncedBounds, {
    minResults: 10,
    includeEchoes: echoLayerEnabled,
    enabled: !isOverview,
  });

  const overviewQuery = useMapOverview(debouncedBounds, region?.latitudeDelta ?? null, isOverview);

  const filtered = useFilteredMapMarkers(data, mapFilter);
  const activeHives = filtered.hives.filter((hive) => isActiveHive(hive));
  const seedHives = mapFilter === 'all' ? filtered.hives.filter((hive) => isSeedHive(hive)) : [];
  const echoes =
    echoLayerEnabled && !isOverview ? (data?.echoes ?? []).slice(0, MAX_ECHO_MARKERS) : [];

  const isEmpty =
    !isOverview &&
    debouncedBounds !== null &&
    data !== undefined &&
    !isFetching &&
    !isError &&
    filtered.stings.length === 0 &&
    activeHives.length === 0 &&
    seedHives.length === 0;

  const hasUnfilteredContent = (data?.stings.length ?? 0) > 0 || (data?.hives.length ?? 0) > 0;
  const filterEmpty =
    !isOverview &&
    mapFilter !== 'all' &&
    hasUnfilteredContent &&
    filtered.stings.length === 0 &&
    activeHives.length === 0 &&
    seedHives.length === 0;

  const nearestQuery = useNearestSting(zoneCoords, isEmpty);
  const nearestSting = nearestQuery.data?.stings[0] ?? null;
  const nearestDistanceM = nearestQuery.data?.distanceM ?? null;

  useEffect(() => {
    void hydrateMapType();
  }, [hydrateMapType]);

  useEffect(() => {
    const delta = region?.latitudeDelta;
    if (delta == null) {
      return;
    }

    setIsOverview((current) => {
      if (!current && delta > OVERVIEW_ENTER_DELTA) {
        return true;
      }
      if (current && delta < OVERVIEW_EXIT_DELTA) {
        return false;
      }
      return current;
    });
  }, [region?.latitudeDelta]);

  useEffect(() => {
    if (!data || !debouncedBounds || isOverview) {
      return;
    }

    const viewportStings = data.stings.filter((sting) =>
      isPointInBounds(sting.location, debouncedBounds),
    );
    const viewportHives = data.hives.filter(
      (hive) => isActiveHive(hive) && isPointInBounds(hive.center, debouncedBounds),
    );
    const viewportSeeds = data.hives.filter(
      (hive) => isSeedHive(hive) && isPointInBounds(hive.center, debouncedBounds),
    );
    const viewportEchoes = (data.echoes ?? []).filter((echo) =>
      isPointInBounds(echo.center, debouncedBounds),
    );

    trackSessionStartOnce({
      zoneId: zoneQuery.data?.id,
      props: {
        stingsInViewport: viewportStings.length,
        hivesInViewport: viewportHives.length,
        seedsInViewport: viewportSeeds.length,
        echoes: viewportEchoes.length,
        expanded: Boolean(data.expanded),
      },
    });
  }, [data, debouncedBounds, isOverview, zoneQuery.data?.id]);

  useEffect(() => {
    if (!isEmpty) {
      emptyShownRef.current = false;
      return;
    }

    if (emptyShownRef.current) {
      return;
    }

    emptyShownRef.current = true;
    trackEvent('map_empty_shown', { zoneId: zoneQuery.data?.id });
  }, [isEmpty, zoneQuery.data?.id]);

  useEffect(() => {
    if (!pendingCampaignId || !activeCampaign) {
      return;
    }

    if (pendingCampaignId === activeCampaign.id) {
      setPendingCampaignId(null);
    }
  }, [activeCampaign, pendingCampaignId, setPendingCampaignId]);

  useEffect(() => {
    if (initialRegion || hasRestoredCachedRegion.current) {
      return;
    }

    if (region && !isDefaultMapRegion(region)) {
      hasRestoredCachedRegion.current = true;
      applyMapRegion(region, { programmatic: true, syncStore: false });
      return;
    }

    const lastKnownCoords = useLocationStore.getState().lastKnownCoords;
    if (lastKnownCoords) {
      hasRestoredCachedRegion.current = true;
      applyMapRegion(coordsToUserMapRegion(lastKnownCoords.latitude, lastKnownCoords.longitude), {
        programmatic: true,
      });
      return;
    }

    if (locationStatus !== 'granted') {
      return;
    }

    hasRestoredCachedRegion.current = true;
    applyMapRegion(DEFAULT_MAP_REGION);
  }, [applyMapRegion, initialRegion, locationStatus, region]);

  useEffect(() => {
    if (!coords) {
      return;
    }

    const currentRegion = liveRegionRef.current;
    const showsDefaultRegion = currentRegion !== null && isDefaultMapRegion(currentRegion);

    if (!showsDefaultRegion && (hasCenteredOnUser.current || !centerOnUserAtStartup)) {
      return;
    }

    hasCenteredOnUser.current = true;
    const userRegion = coordsToUserMapRegion(coords.latitude, coords.longitude);
    applyMapRegion(userRegion, { programmatic: true });
  }, [applyMapRegion, centerOnUserAtStartup, coords]);

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

    applyMapRegion(focusRegion, { programmatic: true });
    setDebouncedBounds(regionToBounds(focusRegion));

    if (pendingMapFocus.stingId) {
      setSelectedStingId(pendingMapFocus.stingId);
    } else if (pendingMapFocus.hiveId) {
      setSelectedStingId(null);
      openHive(pendingMapFocus.hiveId);
    }

    clearPendingMapFocus();
  }, [applyMapRegion, clearPendingMapFocus, pendingMapFocus, setSelectedStingId]);

  useEffect(() => {
    if (!pendingSavedRegion) {
      return;
    }

    hasCenteredOnUser.current = true;
    applyMapRegion(pendingSavedRegion, { programmatic: true });
    setDebouncedBounds(regionToBounds(pendingSavedRegion));
    setSelectedStingId(null);
    clearPendingSavedRegion();
  }, [applyMapRegion, clearPendingSavedRegion, pendingSavedRegion, setSelectedStingId]);

  function handleRegionChange(nextRegion: Region) {
    const mapped = toMapRegion(nextRegion);
    if (isDefaultMapRegion(mapped)) {
      return;
    }

    liveRegionRef.current = mapped;
  }

  function handleRegionChangeComplete(nextRegion: Region) {
    const mapped = toMapRegion(nextRegion);

    if (isDefaultMapRegion(mapped)) {
      if (hasRecoveredFromDefaultRegion.current) {
        return;
      }

      const lastKnown = useLocationStore.getState().lastKnownCoords;
      const target = coords ?? lastKnown;
      if (!target) {
        return;
      }

      hasRecoveredFromDefaultRegion.current = true;
      mapRef.current?.animateToRegion(
        coordsToUserMapRegion(target.latitude, target.longitude),
        350,
      );
      return;
    }

    liveRegionRef.current = mapped;
    setRegion(mapped);
  }

  async function readVisibleMapRegion(): Promise<MapRegion | null> {
    const fallback = liveRegionRef.current ?? initialRegion ?? region;
    const resolved = await resolveMapViewRegion(mapRef, fallback);
    if (resolved && !isDefaultMapRegion(resolved)) {
      liveRegionRef.current = resolved;
      return resolved;
    }
    return fallback;
  }

  function openSting(stingId: string) {
    setSelectedStingId(stingId);
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  function centerOnUserLocation() {
    if (!coords) {
      return;
    }

    const userRegion = coordsToUserMapRegion(coords.latitude, coords.longitude);

    applyMapRegion(userRegion, { programmatic: true });
    setDebouncedBounds(regionToBounds(userRegion));
  }

  function toggleMapType() {
    void setMapType(mapType === 'satellite' ? 'standard' : 'satellite');
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

    if (!draftRegion) {
      showMessageToast('map.savePlaceFailed');
      return;
    }

    setIsSavingPlace(true);

    try {
      const saved = await addSavedPlace({ name, region: draftRegion });
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

  function handleEchoPress(echo: StingEchoCell) {
    showInfoToast({ message: t('growth.echoToast', { count: echo.count }) });
  }

  function handleEmptyCta(cta: 'capture' | 'nearest' | 'invite') {
    trackEvent('empty_cta_tap', { zoneId: zoneQuery.data?.id, props: { cta } });

    if (cta === 'capture') {
      router.push('/(modals)/camera' as Href);
      return;
    }

    if (cta === 'invite') {
      router.push('/(modals)/profile/invites' as Href);
      return;
    }

    if (nearestSting) {
      trackEvent('nearest_sting_opened', { zoneId: zoneQuery.data?.id });
      useMapStore.getState().requestMapFocus({
        lat: nearestSting.location.lat,
        lng: nearestSting.location.lng,
        stingId: nearestSting.id,
        hiveId: null,
      });
    }
  }

  async function handleJoinWaitlist() {
    if (!coords || joiningWaitlist) {
      return;
    }

    setJoiningWaitlist(true);
    try {
      await zonesApi.joinWaitlist({
        lat: coords.latitude,
        lng: coords.longitude,
        email: user?.email ?? undefined,
      });
      setWaitlistJoined(true);
      trackEvent('waitlist_submitted', { zoneId: zoneQuery.data?.id });
    } catch (error) {
      if (getApiErrorCode(error) === 'WAITLIST_ALREADY_JOINED') {
        setWaitlistJoined(true);
        return;
      }
      showApiErrorToast(error);
    } finally {
      setJoiningWaitlist(false);
    }
  }

  const savePlaceDefaultName = t('map.savePlaceDefaultName', {
    index: savedPlaces.length + 1,
  });

  const tabBarInset = getGlassTabBarInset(insets.bottom);
  const mapRegion = initialRegion ?? DEFAULT_MAP_REGION;

  if (locationStatus !== 'granted') {
    return (
      <LocationAccessGate
        bottomInset={tabBarInset}
        status={locationStatus}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  if (zoneQuery.data?.status === 'waitlist') {
    return (
      <WaitlistContent
        joining={joiningWaitlist}
        joined={waitlistJoined}
        zone={zoneQuery.data}
        onJoin={() => void handleJoinWaitlist()}
      />
    );
  }

  const chipsTop = insets.top + 12;
  const bannerTop = chipsTop + FILTER_CHIPS_HEIGHT + 10;
  const hasTopBanner = Boolean(activeCampaign) || Boolean(data?.expanded) || isEmpty || filterEmpty;
  const bookmarkTop = hasTopBanner ? bannerTop + 88 : bannerTop;

  return (
    <View className="flex-1">
      {isGoogleMapsConfigured() ? (
        <MapView
          key={Platform.OS === 'android' ? `${colorScheme}-${mapType}` : 'map'}
          ref={mapRef}
          style={styles.mapLayer}
          initialRegion={liveRegionRef.current ?? mapRegion}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => {
            void readVisibleMapRegion();
          }}
          showsUserLocation
          showsMyLocationButton={false}
          userInterfaceStyle={colorScheme}
          mapType={mapType === 'satellite' ? 'hybrid' : 'standard'}
          customMapStyle={
            mapType === 'standard'
              ? colorScheme === 'dark'
                ? HIVE_DARK_MAP_STYLE
                : HIVE_LIGHT_MAP_STYLE
              : undefined
          }
          {...(Platform.OS === 'android' ? { googleRenderer: 'LEGACY' as const } : {})}
        >
          {isOverview
            ? (overviewQuery.data?.clusters ?? []).map((cluster) => (
                <OverviewClusterMarker
                  key={cluster.cellId}
                  cluster={cluster}
                  onPress={(nextRegion) => applyMapRegion(nextRegion, { programmatic: true })}
                />
              ))
            : null}
          {!isOverview
            ? echoes.map((echo) => (
                <EchoMarker key={echo.cellId} echo={echo} onPress={handleEchoPress} />
              ))
            : null}
          {!isOverview
            ? filtered.stings.map((sting) => (
                <StingMarker
                  key={sting.id}
                  sting={sting}
                  imageUri={stingMarkerImages[sting.id]}
                  onPress={() => openSting(sting.id)}
                />
              ))
            : null}
          {!isOverview
            ? seedHives.map((hive) => (
                <HiveSeedMarker
                  key={hive.id}
                  hive={hive}
                  imageUri={hiveMarkerImages[hive.id]}
                  onPress={() => {
                    trackEvent('seed_marker_tap', { zoneId: zoneQuery.data?.id });
                    openHive(hive.id);
                  }}
                />
              ))
            : null}
          {!isOverview
            ? activeHives.map((hive) => (
                <HiveCircle
                  key={hive.id}
                  hive={hive}
                  imageUri={hiveMarkerImages[hive.id]}
                  onPress={() => openHive(hive.id)}
                />
              ))
            : null}
        </MapView>
      ) : (
        <View className="flex-1 items-center justify-center bg-hive-surface px-8">
          <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
            {t('map.mapsKeyMissingTitle')}
          </Text>
          <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
            {t('map.mapsKeyMissingMessage')}
          </Text>
        </View>
      )}

      <View pointerEvents="box-none" style={styles.overlayLayer}>
        {Platform.OS === 'android' &&
          !isOverview &&
          activeHives.map((hive) => (
            <HiveMarkerCapture
              key={`${hive.id}:hive:${hive.activeStingsCount}`}
              count={hive.activeStingsCount}
              hiveId={hive.id}
              variant="hive"
              onCaptured={handleHiveMarkerCaptured}
            />
          ))}
        {Platform.OS === 'android' &&
          !isOverview &&
          seedHives.map((hive) => (
            <HiveMarkerCapture
              key={`${hive.id}:seed:${hive.activeStingsCount}`}
              count={hive.activeStingsCount}
              hiveId={hive.id}
              variant="seed"
              onCaptured={handleHiveMarkerCaptured}
            />
          ))}
        {Platform.OS === 'android' &&
          !isOverview &&
          filtered.stings.map((sting) => (
            <StingMarkerCapture
              key={sting.id}
              sting={sting}
              onCaptured={handleStingMarkerCaptured}
            />
          ))}

        {!isOverview ? (
          <View pointerEvents="box-none" style={[styles.filterChips, { top: chipsTop }]}>
            <MapFilterChips value={mapFilter} onChange={setMapFilter} />
          </View>
        ) : null}

        <View
          pointerEvents="box-none"
          className="absolute left-4 right-4 gap-2"
          style={{ top: bannerTop }}
        >
          {activeCampaign ? (
            <CampaignBanner
              campaign={activeCampaign}
              onPress={() => router.push('/(modals)/camera' as Href)}
            />
          ) : null}

          {data?.expanded && data.appliedRadiusM ? (
            <View
              pointerEvents="none"
              className="rounded-hive-md bg-hive-surface/95 px-4 py-2.5 shadow-sm"
            >
              <Text className="text-center font-inter text-xs font-semibold text-hive-muted">
                {t('growth.expandedRadius', { distance: formatDistance(data.appliedRadiusM) })}
              </Text>
            </View>
          ) : null}

          {isEmpty ? (
            <MapEmptyState
              isFirstEver={Boolean(zoneQuery.data?.isFirstEver)}
              nearestDistanceM={nearestDistanceM}
              ttlSec={zoneQuery.data?.ttlSec}
              onCapture={() => handleEmptyCta('capture')}
              onInvite={() => handleEmptyCta('invite')}
              onNearest={() => handleEmptyCta('nearest')}
            />
          ) : null}

          {filterEmpty ? (
            <View className="rounded-hive-md bg-hive-surface/95 px-4 py-3 shadow-sm">
              <Text className="text-center font-inter text-sm font-semibold text-hive-foreground">
                {t('map.filter.emptyTitle')}
              </Text>
              <Text className="mt-1 text-center font-inter text-xs text-hive-muted">
                {t('map.filter.emptyMessage')}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-2"
                onPress={() => setMapFilter('all')}
              >
                <Text className="text-center font-inter text-sm font-bold text-hive-primary">
                  {t('map.filter.reset')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

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

        <View style={[styles.rightControls, { bottom: getGlassTabBarInset(insets.bottom) + 12 }]}>
          <MapTypeButton mapType={mapType} onPress={toggleMapType} />
          <MapLocationButton disabled={!coords} onPress={centerOnUserLocation} />
        </View>
      </View>

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
  filterChips: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  rightControls: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 12,
    ...(Platform.OS === 'android'
      ? {
          elevation: 24,
        }
      : null),
  },
});
