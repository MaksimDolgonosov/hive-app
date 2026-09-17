import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useAwards } from '@/src/hooks/useAwards';
import { getAwardCopy } from '@/src/utils/awards';

export default function AwardsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAwards();

  const awards = useMemo(() => data?.pages.flatMap((page) => page.awards) ?? [], [data?.pages]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  return (
    <ProfileCollectionLayout title={t('awards.title')} onBack={handleBack}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <HiveLoader size={88} strokeWidth={3} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('awards.loadError')}
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
      ) : awards.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
            {t('awards.emptyTitle')}
          </Text>
          <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
            {t('awards.emptyMessage')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 rounded-full bg-hive-primary px-5 py-2.5"
            onPress={() => router.push('/(modals)/camera' as Href)}
          >
            <Text className="font-inter text-sm font-semibold text-hive-on-accent">
              {t('growth.ctaCapture')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (
              hasNextPage &&
              !isFetchingNextPage &&
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 120
            ) {
              void fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              colors={['#FFB800']}
              refreshing={isRefetching && !isLoading}
              tintColor="#FFB800"
              onRefresh={() => void refetch()}
            />
          }
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {awards.map((award, index) => {
            const copy = getAwardCopy(award.type);
            return (
              <View
                key={award.id ?? `${award.type}-${award.createdAt}-${index}`}
                className="rounded-2xl border border-hive-stroke bg-hive-surface px-4 py-3.5"
              >
                <Text className="font-display text-[16px] font-bold text-hive-foreground">
                  {copy.title}
                </Text>
                {copy.hint ? (
                  <Text className="mt-1 font-inter text-[13px] text-hive-muted">{copy.hint}</Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </ProfileCollectionLayout>
  );
}
