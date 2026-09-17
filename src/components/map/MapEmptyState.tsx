import { Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { formatDistance } from '@/src/utils/geo';
import { formatTtl } from '@/src/utils/ttl';

type MapEmptyStateProps = {
  isFirstEver: boolean;
  ttlSec?: number;
  nearestDistanceM: number | null;
  onCapture: () => void;
  onNearest: () => void;
  onInvite: () => void;
};

export function MapEmptyState({
  isFirstEver,
  ttlSec,
  nearestDistanceM,
  onCapture,
  onInvite,
  onNearest,
}: MapEmptyStateProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();

  return (
    <View
      pointerEvents="box-none"
      className="rounded-hive-md border border-hive-stroke bg-hive-surface/95 px-3 py-2.5 shadow-sm"
    >
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-display text-[15px] font-bold text-hive-foreground"
          >
            {isFirstEver ? t('growth.emptyFirstTitle') : t('growth.emptyQuietTitle')}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 font-inter text-xs text-hive-muted">
            {ttlSec != null
              ? t('growth.emptyTtl', { ttl: formatTtl(ttlSec) })
              : t('growth.emptyTtlPending')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('growth.ctaCapture')}
          className="h-9 flex-row items-center gap-1.5 rounded-full bg-hive-primary px-3"
          onPress={onCapture}
        >
          <Camera color={theme.textOnAccent} size={14} strokeWidth={2.5} />
          <Text className="font-inter text-xs font-bold text-hive-on-accent">
            {t('growth.firstCaptureAction')}
          </Text>
        </Pressable>
      </View>

      <View className="mt-1.5 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {nearestDistanceM != null ? (
          <Pressable accessibilityRole="button" className="py-0.5" onPress={onNearest}>
            <Text className="font-inter text-xs font-semibold text-hive-primary">
              {t('growth.ctaNearest', { distance: formatDistance(nearestDistanceM) })}
            </Text>
          </Pressable>
        ) : null}

        <Pressable accessibilityRole="button" className="py-0.5" onPress={onInvite}>
          <Text className="font-inter text-xs font-semibold text-hive-muted">
            {t('growth.ctaInvite')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
