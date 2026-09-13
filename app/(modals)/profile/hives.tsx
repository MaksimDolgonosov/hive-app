import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { ProfileHiveCard } from '@/src/components/profile/ProfileHiveCard';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useLocation } from '@/src/hooks/useLocation';
import { useMyHives } from '@/src/hooks/useProfileCollections';
import type { UserHiveSummary } from '@/src/types';
import { haversineDistance } from '@/src/utils/geo';
import { openHive } from '@/src/utils/open-hive';

export default function MyHivesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyHives();

  const hives = useMemo(() => data?.pages.flatMap((page) => page.hives) ?? [], [data?.pages]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  function resolveDistanceM(hive: UserHiveSummary): number | null {
    if (!coords) {
      return null;
    }

    return haversineDistance({ lat: coords.latitude, lng: coords.longitude }, hive.center);
  }

  const listBottomInset = insets.bottom + 24;

  return (
    <ProfileCollectionLayout title={t('profile.menuHives')} onBack={handleBack}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <HiveLoader size={88} strokeWidth={3} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('profile.collections.loadError')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-4 rounded-full bg-hive-primary px-5 py-2.5"
            onPress={() => void refetch()}
          >
            <Text className="font-inter text-sm font-semibold text-hive-on-accent">
              {t('profile.collections.retry')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: listBottomInset,
            flexGrow: hives.length === 0 ? 1 : undefined,
            gap: 10,
          }}
          data={hives}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              colors={['#FFB800']}
              refreshing={isRefetching && !isLoading}
              tintColor="#FFB800"
              onRefresh={() => void refetch()}
            />
          }
          renderItem={({ item }) => (
            <ProfileHiveCard
              hive={item}
              distanceM={resolveDistanceM(item)}
              onPress={() => openHive(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
                {t('profile.collections.hivesEmptyTitle')}
              </Text>
              <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
                {t('profile.collections.hivesEmptyMessage')}
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-6">
                <HiveLoader size="large" />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
        />
      )}
    </ProfileCollectionLayout>
  );
}
