import { Image } from 'expo-image';
import { ChevronRight, Clock, Hexagon, Navigation } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Timer } from '@/src/components/ui/Timer';
import { useHiveDetail } from '@/src/hooks/useHiveDetail';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import type { Hive } from '@/src/types';
import { formatDistance } from '@/src/utils/geo';

const PREVIEW_SLOTS = 3;
const PREVIEW_HEIGHT = 128;

type HiveNearbyCardProps = {
  hive: Hive;
  distanceM: number;
  onPress: () => void;
};

export function HiveNearbyCard({ hive, distanceM, onPress }: HiveNearbyCardProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const { data } = useHiveDetail(hive.id);
  const photoCount = hive.activeStingsCount;

  const previewUrls = useMemo(() => {
    if (!data?.stings?.length) {
      return [];
    }

    return [...data.stings]
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, PREVIEW_SLOTS)
      .map((sting) => sting.thumbnailUrl || sting.imageUrl);
  }, [data?.stings]);

  const expiresAt = useMemo(() => {
    if (!data?.stings?.length) {
      return null;
    }

    return data.stings.reduce(
      (latest, sting) => (sting.expiresAt > latest ? sting.expiresAt : latest),
      data.stings[0].expiresAt,
    );
  }, [data?.stings]);

  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-[22px] border border-hive-stroke bg-hive-surface p-2.5"
      style={{ borderBottomWidth: 1, borderColor: 'rgba(255, 165, 0, 0.5)' }}
      onPress={onPress}
    >
      <View
        className="flex-row gap-1 overflow-hidden rounded-[14px]"
        style={{ height: PREVIEW_HEIGHT }}
      >
        {Array.from({ length: PREVIEW_SLOTS }, (_, index) => {
          const uri = previewUrls[index];

          return (
            <View
              key={uri ?? `slot-${index}`}
              className="flex-1 overflow-hidden rounded-[10px]"
              style={{ height: PREVIEW_HEIGHT, backgroundColor: theme.surface2 }}
            >
              {uri ? (
                <Image
                  accessibilityLabel={t('sting.photoAlt')}
                  contentFit="cover"
                  source={{ uri }}
                  style={{ width: '100%', height: PREVIEW_HEIGHT }}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View className="mt-2.5 flex-row items-center gap-3 px-1 pb-1">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-hive-primary/15">
          <Hexagon color={theme.accent} fill="rgba(255, 184, 0, 0.28)" size={28} />
        </View>

        <View className="flex-1 gap-1.5">
          <Text className="font-display text-[17px] font-bold text-hive-foreground">
            {t('hive.title')}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-inter text-[13px] font-semibold text-hive-muted">
              {t('hive.photoCount', { count: photoCount })}
            </Text>
            {/* <HiveContributorAvatars stings={data?.stings ?? []} /> */}
            {expiresAt ? (
              <>
                <View className="h-[3px] w-[3px] rounded-full bg-hive-muted" />
                <View className="flex-row items-center gap-1">
                  <Clock color={theme.accent} size={13} strokeWidth={2.25} />
                  <Timer
                    expiresAt={expiresAt}
                    className="font-inter text-[13px] font-bold text-hive-primary"
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Navigation color={theme.signal} fill={theme.signal} size={13} strokeWidth={2.25} />
          <Text className="font-inter text-xs font-bold text-hive-foreground">
            {formatDistance(distanceM)}
          </Text>
          <ChevronRight color={theme.textMuted} size={18} strokeWidth={2.25} />
        </View>
      </View>
    </Pressable>
  );
}
