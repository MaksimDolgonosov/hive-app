import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { HiveTheme } from '@/src/theme/tokens';
import type { Sting } from '@/src/types';

type HiveSheetBentoProps = {
  stings: Sting[];
  onPressSting: (stingId: string) => void;
};

function formatRelativeTime(isoDate: string, t: (key: string, options?: { count: number }) => string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) {
    return t('hive.justNow');
  }

  if (minutes < 60) {
    return t('hive.minutesAgo', { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('hive.hoursAgo', { count: hours });
  }

  return t('hive.daysAgo', { count: Math.floor(hours / 24) });
}

function PhotoTile({
  sting,
  className,
  radius,
  onPress,
  badge,
}: {
  sting: Sting;
  className: string;
  radius: number;
  onPress: () => void;
  badge?: string;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      className={`overflow-hidden ${className}`}
      style={{ borderRadius: radius, backgroundColor: HiveTheme.surface2 }}
      onPress={onPress}
    >
      <Image
        accessibilityLabel={t('sting.photoAlt')}
        contentFit="cover"
        source={{ uri: sting.thumbnailUrl }}
        style={{ width: '100%', height: '100%' }}
      />

      {badge ? (
        <View className="absolute bottom-3 left-3 flex-row items-center gap-1.5 rounded-xl bg-[#0B0A08]/70 px-2.5 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-hive-signal" />
          <Text className="font-inter text-[11px] font-semibold text-[#F6F2EA]">{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function chunkStings(stings: Sting[], size: number): Sting[][] {
  const rows: Sting[][] = [];

  for (let index = 0; index < stings.length; index += size) {
    rows.push(stings.slice(index, index + size));
  }

  return rows;
}

export function HiveSheetBento({ stings, onPressSting }: HiveSheetBentoProps) {
  const { t } = useTranslation();

  if (stings.length === 0) {
    return null;
  }

  const hero = stings[0];
  const side = stings.slice(1, 3);
  const tail = stings.slice(3);

  if (stings.length === 1) {
    return (
      <PhotoTile
        badge={formatRelativeTime(hero.createdAt, t)}
        className="h-[156px] w-full"
        radius={18}
        sting={hero}
        onPress={() => onPressSting(hero.id)}
      />
    );
  }

  if (stings.length === 2) {
    return (
      <View className="h-[156px] flex-row gap-2">
        {stings.map((sting, index) => (
          <PhotoTile
            key={sting.id}
            badge={index === 0 ? formatRelativeTime(sting.createdAt, t) : undefined}
            className="flex-1"
            radius={18}
            sting={sting}
            onPress={() => onPressSting(sting.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="gap-2">
      <View className="h-[156px] flex-row gap-2">
        <PhotoTile
          badge={formatRelativeTime(hero.createdAt, t)}
          className="flex-1"
          radius={18}
          sting={hero}
          onPress={() => onPressSting(hero.id)}
        />
        <View className="w-[110px] gap-2">
          {side.map((sting) => (
            <PhotoTile
              key={sting.id}
              className="flex-1"
              radius={18}
              sting={sting}
              onPress={() => onPressSting(sting.id)}
            />
          ))}
        </View>
      </View>

      {chunkStings(tail, 3).map((row) => (
        <View key={row.map((sting) => sting.id).join('-')} className="h-24 flex-row gap-2">
          {row.map((sting) => (
            <PhotoTile
              key={sting.id}
              className="flex-1"
              radius={16}
              sting={sting}
              onPress={() => onPressSting(sting.id)}
            />
          ))}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }, (_, index) => (
                <View key={`spacer-${index}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
