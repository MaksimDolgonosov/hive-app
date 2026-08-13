import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveNearbyCard } from '@/src/components/feed/HiveNearbyCard';
import { NearbyCard } from '@/src/components/feed/NearbyCard';
import { HiveBottomSheet } from '@/src/components/ui/HiveBottomSheet';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { useLocation } from '@/src/hooks/useLocation';
import { useStingsNearby } from '@/src/hooks/useStingsNearby';
import { useMapStore } from '@/src/stores/mapStore';
import type { Hive, MapBounds, Sting } from '@/src/types';
import { haversineDistance } from '@/src/utils/geo';
import { isActiveHive } from '@/src/utils/hive';
import { regionToBounds } from '@/src/utils/map';

const FEED_REGION_DELTA = 0.05;

type FeedItem =
  | { key: string; type: 'sting'; sting: Sting; distanceM: number }
  | { key: string; type: 'hive'; hive: Hive; distanceM: number };

function coordsToBounds(lat: number, lng: number): MapBounds {
  return regionToBounds({
    latitude: lat,
    longitude: lng,
    latitudeDelta: FEED_REGION_DELTA,
    longitudeDelta: FEED_REGION_DELTA,
  });
}

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

  const hiveItems: FeedItem[] = hives
    .filter((hive) => isActiveHive(hive.activeStingsCount))
    .map((hive) => ({
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
  const { coords, status: locationStatus } = useLocation();
  const mapRegion = useMapStore((state) => state.region);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);

  const bounds = useMemo(() => {
    if (mapRegion) {
      return regionToBounds(mapRegion);
    }

    if (coords) {
      return coordsToBounds(coords.latitude, coords.longitude);
    }

    return null;
  }, [coords, mapRegion]);

  const { data, isFetching, isError, refetch, isRefetching } = useStingsNearby(bounds);

  const feedItems = useMemo(() => {
    if (!coords || !data) {
      return [];
    }

    return buildFeedItems(data.stings, data.hives, coords.latitude, coords.longitude);
  }, [coords, data]);

  function openSting(stingId: string) {
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  function openHive(hiveId: string) {
    setSelectedHiveId(hiveId);
  }

  function closeHiveSheet() {
    setSelectedHiveId(null);
  }

  const listBottomInset = getGlassTabBarInset(insets.bottom) + 16;

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
      <View
        className="flex-1 items-center justify-center bg-hive-bg px-8"
        style={{ paddingBottom: listBottomInset }}
      >
        <Text className="text-center font-inter text-lg font-semibold text-hive-foreground">
          {t('map.locationDeniedTitle')}
        </Text>
        <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
          {t('nearby.locationDeniedMessage')}
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

  return (
    <View className="flex-1 bg-hive-bg">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="font-inter text-2xl font-bold text-hive-foreground">{t('nearby.title')}</Text>
        <Text className="mt-1 font-inter text-sm text-hive-muted">{t('nearby.subtitle')}</Text>
      </View>

      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: listBottomInset,
          flexGrow: feedItems.length === 0 ? 1 : undefined,
          gap: 10,
        }}
        data={feedItems}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl
            colors={['#F5A623']}
            refreshing={isRefetching && !isFetching}
            tintColor="#F5A623"
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
              <ActivityIndicator size="large" color="#F5A623" />
            </View>
          ) : isError ? (
            <View className="flex-1 items-center justify-center px-6 py-16">
              <Text className="text-center font-inter text-base text-hive-foreground">
                {t('map.loadError')}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-4 rounded-hive-md bg-hive-primary px-5 py-2.5"
                onPress={() => void refetch()}
              >
                <Text className="font-inter text-sm font-semibold text-white">
                  {t('nearby.retry')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
                {t('nearby.emptyTitle')}
              </Text>
              <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
                {t('nearby.emptyMessage')}
              </Text>
            </View>
          )
        }
      />

      {isFetching && feedItems.length > 0 && (
        <View className="absolute right-4 top-2 rounded-full bg-hive-surface px-3 py-2 shadow-sm">
          <ActivityIndicator size="small" color="#F5A623" />
        </View>
      )}

      {selectedHiveId && (
        <HiveBottomSheet hiveId={selectedHiveId} onClose={closeHiveSheet} />
      )}
    </View>
  );
}
