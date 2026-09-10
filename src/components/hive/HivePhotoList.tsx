import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import type { Sting } from '@/src/types';

const COLUMN_COUNT = 3;
const COLUMN_GAP = 5;

type HivePhotoListProps = {
  stings: Sting[];
  onPressSting: (stingId: string) => void;
};

function chunkStings(stings: Sting[], size: number): Sting[][] {
  const rows: Sting[][] = [];

  for (let index = 0; index < stings.length; index += size) {
    rows.push(stings.slice(index, index + size));
  }

  return rows;
}

export function HivePhotoList({ stings, onPressSting }: HivePhotoListProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();

  if (stings.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: COLUMN_GAP }}>
      {chunkStings(stings, COLUMN_COUNT).map((row) => (
        <View
          key={row.map((sting) => sting.id).join('-')}
          className="flex-row"
          style={{ gap: COLUMN_GAP }}
        >
          {row.map((sting) => (
            <Pressable
              key={sting.id}
              accessibilityRole="button"
              accessibilityLabel={t('sting.photoAlt')}
              className="flex-1 overflow-hidden rounded-[9px]"
              style={{ aspectRatio: 3 / 4, backgroundColor: theme.surface2 }}
              onPress={() => onPressSting(sting.id)}
            >
              <Image
                contentFit="cover"
                source={{ uri: sting.thumbnailUrl }}
                style={{ width: '100%', height: '100%' }}
              />
            </Pressable>
          ))}
          {row.length < COLUMN_COUNT
            ? Array.from({ length: COLUMN_COUNT - row.length }, (_, index) => (
                <View key={`spacer-${index}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
