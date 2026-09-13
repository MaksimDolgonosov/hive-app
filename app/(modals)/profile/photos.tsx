import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { profilePhotoGridPadding, ProfilePhotoGrid } from '@/src/components/profile/ProfilePhotoGrid';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useMyStings } from '@/src/hooks/useProfileCollections';

export default function MyPhotosScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyStings();

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
    <ProfileCollectionLayout title={t('profile.menuPhotos')} onBack={handleBack}>
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
      ) : stings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
            {t('profile.collections.photosEmptyTitle')}
          </Text>
          <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
            {t('profile.collections.photosEmptyMessage')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={profilePhotoGridPadding(listBottomInset)}
          refreshControl={
            <RefreshControl
              colors={['#FFB800']}
              refreshing={isRefetching && !isLoading}
              tintColor="#FFB800"
              onRefresh={() => void refetch()}
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;

            if (nearBottom && hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          scrollEventThrottle={16}
        >
          <ProfilePhotoGrid stings={stings} onPressSting={openSting} />
          {isFetchingNextPage ? (
            <View className="items-center py-6">
              <HiveLoader size="large" />
            </View>
          ) : null}
        </ScrollView>
      )}
    </ProfileCollectionLayout>
  );
}
