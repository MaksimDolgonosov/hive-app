import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

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
  onNearest,
  onInvite,
}: MapEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View
      pointerEvents="box-none"
      className="rounded-hive-md bg-hive-surface/95 px-4 py-3 shadow-sm"
    >
      <Text className="text-center font-display text-[15px] font-bold text-hive-foreground">
        {isFirstEver ? t('growth.emptyFirstTitle') : t('growth.emptyQuietTitle')}
      </Text>
      <Text className="mt-1 text-center font-inter text-xs text-hive-muted">
        {ttlSec != null
          ? t('growth.emptyTtl', { ttl: formatTtl(ttlSec) })
          : t('growth.emptyTtlPending')}
      </Text>

      <Pressable
        accessibilityRole="button"
        className="mt-3 h-11 items-center justify-center rounded-full bg-hive-primary"
        onPress={onCapture}
      >
        <Text className="font-inter text-sm font-bold text-hive-on-accent">
          {t('growth.ctaCapture')}
        </Text>
      </Pressable>

      {nearestDistanceM != null ? (
        <Pressable
          accessibilityRole="button"
          className="mt-2 h-11 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
          onPress={onNearest}
        >
          <Text className="font-inter text-sm font-semibold text-hive-foreground">
            {t('growth.ctaNearest', { distance: formatDistanceLabel(nearestDistanceM) })}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className="mt-2 h-11 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
        onPress={onInvite}
      >
        <Text className="font-inter text-sm font-semibold text-hive-foreground">
          {t('growth.ctaInvite')}
        </Text>
      </Pressable>
    </View>
  );
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }

  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} км` : `${Math.round(km)} км`;
}
