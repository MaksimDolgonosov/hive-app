import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Timer } from '@/src/components/ui/Timer';
import type { Sting } from '@/src/types';

const COLUMN_COUNT = 3;
const PHOTO_GAP = 8;
const PHOTO_ASPECT_RATIO = 3 / 4;

type ProfilePhotoGridProps = {
  stings: Sting[];
  onPressSting: (stingId: string) => void;
};

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function RowSpacers({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return Array.from({ length: count }, (_, index) => (
    <View key={`spacer-${index}`} className="flex-1" />
  ));
}

export function ProfilePhotoGrid({ stings, onPressSting }: ProfilePhotoGridProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: PHOTO_GAP }}>
      {chunkItems(stings, COLUMN_COUNT).map((row) => (
        <View
          key={row.map((sting) => sting.id).join('-')}
          className="flex-row"
          style={{ gap: PHOTO_GAP }}
        >
          {row.map((sting) => (
            <Pressable
              key={sting.id}
              accessibilityRole="button"
              accessibilityLabel={t('sting.photoAlt')}
              className="flex-1 overflow-hidden rounded-hive-md border border-white/50"
              style={{ aspectRatio: PHOTO_ASPECT_RATIO, backgroundColor: '#201C16' }}
              onPress={() => onPressSting(sting.id)}
            >
              <Image contentFit="cover" source={{ uri: sting.thumbnailUrl }} style={styles.photo} />
              <View className="absolute bottom-0 left-0 right-0 bg-black/45 px-1.5 py-1">
                <Timer
                  expiresAt={sting.expiresAt}
                  className="font-inter text-[10px] font-medium text-white"
                />
              </View>
            </Pressable>
          ))}
          <RowSpacers count={COLUMN_COUNT - row.length} />
        </View>
      ))}
    </View>
  );
}

export function profilePhotoGridPadding(listBottomInset: number) {
  return {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: listBottomInset,
  };
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#201C16',
  },
});
