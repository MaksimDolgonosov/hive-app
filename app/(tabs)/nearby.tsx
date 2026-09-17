import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveNearbyCard } from '@/src/components/feed/HiveNearbyCard';
import { NearbyCard } from '@/src/components/feed/NearbyCard';
import { MapEmptyState } from '@/src/components/map/MapEmptyState';
import { LocationAccessGate } from '@/src/components/map/LocationAccessGate';
import { WaitlistContent } from '@/src/components/growth/WaitlistContent';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import * as zonesApi from '@/src/api/zones';
import { useLocation } from '@/src/hooks/useLocation';
import { useNearestSting } from '@/src/hooks/useNearestSting';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useZoneStatus } from '@/src/hooks/useZoneStatus';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import type { Hive, Sting } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';
import { getApiErrorCode } from '@/src/utils/api-error';
import { formatDistance, haversineDistance } from '@/src/utils/geo';
import { coordsToFeedBounds, regionToBounds } from '@/src/utils/map';
import { openHive } from '@/src/utils/open-hive';
import { showApiErrorToast } from '@/src/utils/show-toast';

type FeedItem =
  | { key: string; type: 'sting'; sting: Sting; distanceM: number }
  | { key: string; type: 'hive'; hive: Hive; distanceM: number };

function buildFeedItems(
  stings: Sting[],
  hives: Hive[],
  userLat: number,
  userLng: number,
): FeedItem[] {
  const origin = { lat: userLat, lng: userLng };

  const stingItems: FeedItem[] = stings.map((sting) => ({
    key: `sting-${sting.id}`,
    type: 'sting',
    sting,
    distanceM: haversineDistance(origin, sting.location),
  }));

  // Рендерим кластеры любой стадии (§G13): жала соты убраны из stings[],
  // и без их карточки фото пропали бы из ленты. Стадию карточка учитывает сама.
  const hiveItems: FeedItem[] = hives.map((hive) => ({
    key: `hive-${hive.id}`,
    type: 'hive',
    hive,
    distanceM: haversineDistance(origin, hive.center),
  }));

  return [...stingItems, ...hiveItems].sort((a, b) => a.distanceM - b.distanceM);
}

export default function NearbyScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { coords, status: locationStatus, requestPermission } = useLocation();
  const lastKnownCoords = useLocationStore((state) => state.lastKnownCoords);
  const mapRegion = useMapStore((state) => state.region);

  const bounds = useMemo(() => {
    if (mapRegion) {
      return regionToBounds(mapRegion);
    }

    if (coords) {
      return coordsToFeedBounds(coords.latitude, coords.longitude);
    }

    if (lastKnownCoords) {
      return coordsToFeedBounds(lastKnownCoords.latitude, lastKnownCoords.longitude);
    }

    return null;
  }, [coords, lastKnownCoords, mapRegion]);

  const effectiveCoords = coords ?? lastKnownCoords;

  const { data, isFetching, isError, refetch, isRefetching } = useStingsNearby(bounds, {
    minResults: 20,
  });
  const zoneCoords = effectiveCoords
    ? { lat: effectiveCoords.latitude, lng: effectiveCoords.longitude }
    : null;
  const zoneQuery = useZoneStatus(zoneCoords);
  const user = useAuthStore((state) => state.user);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const feedItems = useMemo(() => {
    if (!effectiveCoords || !data) {
      return [];
    }

    return buildFeedItems(
      data.stings,
      data.hives,
      effectiveCoords.latitude,
      effectiveCoords.longitude,
    );
  }, [data, effectiveCoords]);

  const isFeedEmpty = Boolean(data) && !isFetching && !isError && feedItems.length === 0;
  const nearestQuery = useNearestSting(zoneCoords, isFeedEmpty);

  function openSting(stingId: string) {
    router.push(`/(modals)/sting/${stingId}` as Href);
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

    const nearest = nearestQuery.data?.stings[0];
    if (nearest) {
      trackEvent('nearest_sting_opened', { zoneId: zoneQuery.data?.id });
      useMapStore.getState().requestMapFocus({
        lat: nearest.location.lat,
        lng: nearest.location.lng,
        stingId: nearest.id,
        hiveId: null,
      });
      router.push('/(tabs)' as Href);
    }
  }

  async function handleJoinWaitlist() {
    if (!effectiveCoords || joiningWaitlist) {
      return;
    }

    setJoiningWaitlist(true);
    try {
      await zonesApi.joinWaitlist({
        lat: effectiveCoords.latitude,
        lng: effectiveCoords.longitude,
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

  const listBottomInset = getGlassTabBarInset(insets.bottom) + 16;

  if (locationStatus !== 'granted') {
    return (
      <LocationAccessGate
        bottomInset={listBottomInset}
        deniedMessageKey="nearby"
        status={locationStatus}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  if (zoneQuery.data?.status === 'waitlist') {
    return (
      <ScreenBackground>
        <WaitlistContent
          joining={joiningWaitlist}
          joined={waitlistJoined}
          zone={zoneQuery.data}
          onJoin={() => void handleJoinWaitlist()}
        />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View
        className="flex-row items-end justify-between px-5 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="font-display text-[28px] font-bold text-hive-foreground">
          {t('nearby.title')}
        </Text>
        <View className="flex-row items-center gap-1.5 rounded-full bg-hive-signal/20 px-3 py-[7px]">
          <View className="h-1.5 w-1.5 rounded-full bg-hive-signal" />
          <Text className="font-inter text-xs font-semibold text-hive-signal">
            {t('nearby.activeCount', { count: feedItems.length })}
          </Text>
        </View>
      </View>

      {data?.expanded && data.appliedRadiusM ? (
        <View className="mx-5 mb-3 rounded-hive-md bg-hive-surface px-4 py-2.5">
          <Text className="text-center font-inter text-xs font-semibold text-hive-muted">
            {t('growth.expandedRadius', { distance: formatDistance(data.appliedRadiusM) })}
          </Text>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: listBottomInset,
          flexGrow: feedItems.length === 0 ? 1 : undefined,
          gap: 14,
        }}
        data={feedItems}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl
            colors={['#FFB800']}
            refreshing={isRefetching && !isFetching}
            tintColor="#FFB800"
            onRefresh={() => void refetch()}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'hive') {
            return (
              <HiveNearbyCard
                hive={item.hive}
                distanceM={item.distanceM}
                onPress={() => openHive(item.hive.id)}
              />
            );
          }

          return (
            <NearbyCard
              distanceM={item.distanceM}
              sting={item.sting}
              onPress={() => openSting(item.sting.id)}
            />
          );
        }}
        ListEmptyComponent={
          isFetching ? (
            <View className="flex-1 items-center justify-center py-16">
              <HiveLoader size="large" />
            </View>
          ) : isError ? (
            <View className="flex-1 items-center justify-center px-6 py-16">
              <Text className="text-center font-inter text-base text-hive-foreground">
                {t('map.loadError')}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-4 rounded-full bg-hive-primary px-5 py-2.5"
                onPress={() => void refetch()}
              >
                <Text className="font-inter text-sm font-semibold text-hive-on-accent">
                  {t('nearby.retry')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-4 py-8">
              <MapEmptyState
                isFirstEver={Boolean(zoneQuery.data?.isFirstEver)}
                nearestDistanceM={nearestQuery.data?.distanceM ?? null}
                ttlSec={zoneQuery.data?.ttlSec}
                onCapture={() => handleEmptyCta('capture')}
                onInvite={() => handleEmptyCta('invite')}
                onNearest={() => handleEmptyCta('nearest')}
              />
            </View>
          )
        }
      />

      {isFetching && feedItems.length > 0 && (
        <View className="absolute right-4 top-2 rounded-full bg-hive-surface px-3 py-2 shadow-sm">
          <HiveLoader size="small" />
        </View>
      )}
    </ScreenBackground>
  );
}
