import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearbyCard } from '@/src/components/feed/NearbyCard';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useLocation } from '@/src/hooks/useLocation';
import { useLikedStings } from '@/src/hooks/useProfileCollections';
import { haversineDistance } from '@/src/utils/geo';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLikedStings();

  const stings = useMemo(() => data?.pages.flatMap((page) => page.stings) ?? [], [data?.pages]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  function openSting(stingId: string) {
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  const listBottomInset = insets.bottom + 24;

  return (
    <ProfileCollectionLayout title={t('profile.menuFavorites')} onBack={handleBack}>
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
            flexGrow: stings.length === 0 ? 1 : undefined,
            gap: 10,
          }}
          data={stings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              colors={['#FFB800']}
              refreshing={isRefetching && !isLoading}
              tintColor="#FFB800"
              onRefresh={() => void refetch()}
            />
          }
          renderItem={({ item }) => {
            const distanceM = coords
              ? haversineDistance(
                  { lat: coords.latitude, lng: coords.longitude },
                  item.location,
                )
              : 0;

            return (
              <NearbyCard
                distanceM={distanceM}
                sting={item}
                onPress={() => openSting(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
                {t('profile.collections.favoritesEmptyTitle')}
              </Text>
              <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
                {t('profile.collections.favoritesEmptyMessage')}
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
