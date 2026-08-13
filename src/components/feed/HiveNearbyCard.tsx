import { Hexagon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { Hive } from '@/src/types';
import { formatDistance } from '@/src/utils/geo';

type HiveNearbyCardProps = {
  hive: Hive;
  distanceM: number;
  onPress: () => void;
};

export function HiveNearbyCard({ hive, distanceM, onPress }: HiveNearbyCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center overflow-hidden rounded-hive-md bg-hive-surface px-4 py-3"
      onPress={onPress}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-hive-primary/15">
        <Hexagon color="#F5A623" fill="rgba(245, 166, 35, 0.25)" size={28} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-inter text-base font-semibold text-hive-foreground">
          {t('hive.title')}
        </Text>
        <Text className="mt-0.5 font-inter text-sm text-hive-muted">
          {t('hive.photoCount', { count: hive.activeStingsCount })}
        </Text>
      </View>

      <Text className="font-inter text-sm font-semibold text-hive-primary">
        {formatDistance(distanceM)}
      </Text>
    </Pressable>
  );
}
