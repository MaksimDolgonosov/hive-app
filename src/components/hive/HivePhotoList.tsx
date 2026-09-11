import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/src/components/ui/SkeletonBlock';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import type { Sting } from '@/src/types';

const COLUMN_COUNT = 3;
const COLUMN_GAP = 5;
const DEFAULT_SKELETON_COUNT = 6;

type HivePhotoListProps = {
  stings: Sting[];
  onPressSting: (stingId: string) => void;
  isLoading?: boolean;
  skeletonCount?: number;
};

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function HivePhotoSkeleton() {
  const theme = useHiveTheme();

  return (
    <View className="flex-1 overflow-hidden rounded-[9px]" style={{ aspectRatio: 3 / 4 }}>
      <SkeletonBlock
        borderRadius={9}
        height={1}
        style={{ flex: 1, width: '100%', height: '100%', backgroundColor: theme.surface2 }}
      />
    </View>
  );
}

function HivePhotoCell({
  sting,
  onPress,
}: {
  sting: Sting;
  onPress: (stingId: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const uri = sting.thumbnailUrl || sting.imageUrl;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [uri]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sting.photoAlt')}
      className="flex-1 overflow-hidden rounded-[9px]"
      style={{ aspectRatio: 3 / 4, backgroundColor: theme.surface2 }}
      onPress={() => onPress(sting.id)}
    >
      {uri ? (
        <Image
          contentFit="cover"
          source={{ uri }}
          style={styles.photo}
          onLoadEnd={() => setIsImageLoaded(true)}
        />
      ) : null}
      {isImageLoaded ? null : (
        <SkeletonBlock
          borderRadius={9}
          height={1}
          style={[styles.skeletonFill, { backgroundColor: theme.surface2 }]}
        />
      )}
    </Pressable>
  );
}

function RowSpacers({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return Array.from({ length: count }, (_, index) => (
    <View key={`spacer-${index}`} className="flex-1" />
  ));
}

export function HivePhotoList({
  stings,
  onPressSting,
  isLoading = false,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: HivePhotoListProps) {
  if (isLoading) {
    return (
      <View style={{ gap: COLUMN_GAP }}>
        {chunkItems(
          Array.from({ length: skeletonCount }, (_, index) => index),
          COLUMN_COUNT,
        ).map((row) => (
          <View key={row.join('-')} className="flex-row" style={{ gap: COLUMN_GAP }}>
            {row.map((index) => (
              <HivePhotoSkeleton key={index} />
            ))}
            <RowSpacers count={COLUMN_COUNT - row.length} />
          </View>
        ))}
      </View>
    );
  }

  if (stings.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: COLUMN_GAP }}>
      {chunkItems(stings, COLUMN_COUNT).map((row) => (
        <View
          key={row.map((sting) => sting.id).join('-')}
          className="flex-row"
          style={{ gap: COLUMN_GAP }}
        >
          {row.map((sting) => (
            <HivePhotoCell key={sting.id} sting={sting} onPress={onPressSting} />
          ))}
          <RowSpacers count={COLUMN_COUNT - row.length} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: '100%',
  },
  skeletonFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
