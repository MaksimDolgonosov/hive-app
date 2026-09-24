import { ChevronRight, Hexagon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { SEED_FILL } from '@/src/components/map/HiveMarkerFace';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import type { UserHiveSummary } from '@/src/types';
import { formatDistance } from '@/src/utils/geo';
import { resolveHiveStage } from '@/src/utils/hive';

type ProfileHiveCardProps = {
  hive: UserHiveSummary;
  distanceM?: number | null;
  onPress: () => void;
};

export function ProfileHiveCard({ hive, distanceM, onPress }: ProfileHiveCardProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const isSeed = resolveHiveStage(hive) === 'seed';
  const markColor = isSeed ? SEED_FILL : theme.accent;

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 overflow-hidden rounded-hive-md border px-4 py-3.5"
      style={{ backgroundColor: theme.surface, borderColor: theme.stroke }}
      onPress={onPress}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.accentSoft }}
      >
        <Hexagon
          color={markColor}
          fill={isSeed ? 'transparent' : theme.accentSoft}
          size={18}
          strokeWidth={2.25}
        />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-inter text-base font-semibold" numberOfLines={1} style={{ color: theme.text }}>
          {t(isSeed ? 'hive.seed.title' : 'hive.title')}
        </Text>
        <Text className="mt-0.5 font-inter text-xs" numberOfLines={1} style={{ color: theme.textMuted }}>
          {t('profile.collections.hiveYourPhotos', {
            yours: hive.userStingsCount,
            total: hive.activeStingsCount,
          })}
        </Text>
      </View>

      {distanceM != null ? (
        <Text className="font-inter text-sm font-semibold" style={{ color: theme.accent }}>
          {formatDistance(distanceM)}
        </Text>
      ) : null}
      <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />
    </Pressable>
  );
}
