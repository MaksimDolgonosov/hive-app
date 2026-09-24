import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Camera, Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveContributorAvatars } from '@/src/components/hive/HiveContributorAvatars';
import { HivePhotoList } from '@/src/components/hive/HivePhotoList';
import { useCountdown } from '@/src/hooks/useCountdown';
import { useHiveDetail } from '@/src/hooks/useHiveDetail';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useLocationStore } from '@/src/stores/locationStore';
import { haversineDistance } from '@/src/utils/geo';
import { isSeedHive } from '@/src/utils/hive';
import { trackEvent } from '@/src/utils/analytics-queue';

type HiveDetailContentProps = {
  hiveId: string;
};

export function HiveDetailContent({ hiveId }: HiveDetailContentProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();
  const liveCoords = useLocationStore((state) => state.coords);
  const lastKnownCoords = useLocationStore((state) => state.lastKnownCoords);
  const { data, isLoading, isError } = useHiveDetail(hiveId);

  const stingsNewestFirst = useMemo(() => {
    if (!data?.stings) {
      return [];
    }

    return [...data.stings].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [data?.stings]);

  const isInsideHive = useMemo(() => {
    const hive = data?.hive;
    if (!hive) {
      return false;
    }

    const userPoint = liveCoords
      ? { lat: liveCoords.latitude, lng: liveCoords.longitude }
      : lastKnownCoords
        ? { lat: lastKnownCoords.latitude, lng: lastKnownCoords.longitude }
        : null;

    if (!userPoint) {
      return false;
    }

    return haversineDistance(userPoint, hive.center) <= hive.radiusM;
  }, [data?.hive, lastKnownCoords, liveCoords]);

  const hiveExpiresAt = useMemo(() => {
    if (stingsNewestFirst.length === 0) {
      return null;
    }

    return stingsNewestFirst.reduce(
      (latest, sting) => (sting.expiresAt > latest ? sting.expiresAt : latest),
      stingsNewestFirst[0].expiresAt,
    );
  }, [stingsNewestFirst]);

  const hiveLifetimeMs = useMemo(() => {
    if (!hiveExpiresAt) {
      return 1;
    }

    const source =
      stingsNewestFirst.find((sting) => sting.expiresAt === hiveExpiresAt) ?? stingsNewestFirst[0];
    const createdMs = new Date(source.createdAt).getTime();
    const expiresMs = new Date(hiveExpiresAt).getTime();

    return Math.max(expiresMs - createdMs, 1);
  }, [hiveExpiresAt, stingsNewestFirst]);

  const countdown = useCountdown(hiveExpiresAt ?? new Date().toISOString());
  const dissolveProgress = hiveExpiresAt ? Math.min(1, countdown.remainingMs / hiveLifetimeMs) : 0;

  function openSting(stingId: string) {
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  function openCamera() {
    if (isSeed && data?.hive.place) {
      trackEvent('place_seed_cta_tap');
    }
    router.push('/(modals)/camera' as Href);
  }

  const photoCount = data?.stings.length ?? 0;
  const isSeed = data ? isSeedHive(data.hive) : false;
  const bottomInset = isInsideHive ? 16 : insets.bottom + 24;

  return (
    <View className="flex-1">
      <ScrollView
        bounces
        contentContainerStyle={{
          gap: 18,
          paddingHorizontal: 20,
          paddingBottom: bottomInset,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {data ? (
          <View className="gap-3" style={{ marginTop: 15 }}>
            {data.hive.place ? (
              <Pressable
                accessibilityRole="button"
                className="overflow-hidden rounded-2xl bg-hive-surface"
                onPress={() => router.push(`/(modals)/place/${data.hive.place!.id}` as Href)}
              >
                {data.hive.place.coverThumbnailUrl ? (
                  <Image
                    source={{ uri: data.hive.place.coverThumbnailUrl }}
                    style={{ width: '100%', height: 140 }}
                  />
                ) : null}
                <View className="gap-1 px-3 py-3">
                  <Text className="font-display text-lg font-bold text-hive-foreground">
                    {data.hive.place.name}
                  </Text>
                  <Text className="font-inter text-xs font-semibold text-hive-primary">{t('place.badge')}</Text>
                  {isSeed ? (
                    <Text className="font-inter text-[13px] text-hive-muted">
                      {t('place.seedCta', { name: data.hive.place.name })}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ) : null}
            <View className="flex-row items-center gap-2">
            <Text className="font-inter text-[13px] font-semibold text-hive-primary">
              {t('hive.photoCount', { count: photoCount })}
            </Text>
            <HiveContributorAvatars ringColor={theme.bg} stings={stingsNewestFirst} />
            </View>
          </View>
        ) : null}

        {isLoading && !data ? (
          <HivePhotoList isLoading stings={[]} onPressSting={openSting} />
        ) : null}

        {isError ? (
          <Text className="py-8 text-center font-inter text-sm text-hive-muted">
            {t('hive.loadError')}
          </Text>
        ) : null}

        {data && data.stings.length === 0 ? (
          <Text className="py-8 text-center font-inter text-sm text-hive-muted">
            {t('hive.empty')}
          </Text>
        ) : null}

        {isSeed ? (
          <View className="gap-1 rounded-2xl bg-hive-surface2 p-3.5">
            <Text className="font-display text-[15px] font-bold text-hive-foreground">
              {t('hive.seed.title')}
            </Text>
            <Text className="font-inter text-[13px] text-hive-muted">{t('hive.seed.hint')}</Text>
          </View>
        ) : null}

        {stingsNewestFirst.length > 0 ? (
          <>
            {hiveExpiresAt ? (
              <View className="gap-2.5 rounded-2xl bg-hive-primary/15 p-3.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Clock color={theme.accent} size={18} strokeWidth={2.25} />
                    <Text className="font-inter text-[13px] font-medium text-hive-muted">
                      {isSeed ? t('hive.seed.photosDisappearIn') : t('hive.dissolvesIn')}
                    </Text>
                  </View>
                  <Text className="font-display text-[15px] font-bold text-hive-primary">
                    {countdown.isExpired ? '0:00' : countdown.remainingLabel}
                  </Text>
                </View>
                <View className="h-[5px] overflow-hidden rounded-[3px] bg-white/10">
                  <View
                    className="h-full rounded-[3px] bg-hive-primary"
                    style={{ width: `${Math.round(dissolveProgress * 100)}%` }}
                  />
                </View>
              </View>
            ) : null}

            <HivePhotoList stings={stingsNewestFirst} onPressSting={openSting} />
          </>
        ) : null}
      </ScrollView>

      {isInsideHive ? (
        <View className="px-5" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSeed ? t('hive.seed.addPhoto') : t('hive.addPhoto')}
            className="h-[54px] flex-row items-center justify-center gap-2.5 rounded-full bg-hive-primary"
            onPress={openCamera}
          >
            <Camera color={theme.textOnAccent} size={20} strokeWidth={2.25} />
            <Text className="font-inter text-[15px] font-bold text-hive-on-accent">
              {isSeed ? t('hive.seed.addPhoto') : t('hive.addPhoto')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
