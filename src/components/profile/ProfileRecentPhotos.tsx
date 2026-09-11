import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

const COLUMN_COUNT = 3;
const PHOTO_GAP = 8;
const PHOTO_ASPECT_RATIO = 3 / 4;
const STRIP_PREVIEW_COUNT = 4;

type ProfileRecentPhotosProps = {
  photoUrls?: string[];
  onViewAll?: () => void;
  layout?: 'strip' | 'grid';
};

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

export function ProfileRecentPhotos({
  photoUrls = [],
  onViewAll,
  layout = 'strip',
}: ProfileRecentPhotosProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const hasPhotos = photoUrls.length > 0;

  return (
    <View className="gap-3">
      <View
        className={
          layout === 'grid'
            ? 'flex-row items-center justify-between px-5'
            : 'flex-row items-center justify-between'
        }
      >
        <Text className="font-inter text-[15px] font-bold text-hive-foreground">
          {t('profile.recentPhotos')}
        </Text>
        {onViewAll ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAll}>
            <Text className="font-inter text-[13px] font-semibold text-hive-primary">
              {t('profile.viewAll')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {layout === 'grid' ? (
        <RecentPhotosGrid photoUrls={photoUrls} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {hasPhotos
            ? photoUrls.slice(0, STRIP_PREVIEW_COUNT).map((uri) => (
                <Image
                  key={uri}
                  contentFit="cover"
                  source={{ uri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 16,
                    backgroundColor: theme.surface2,
                  }}
                />
              ))
            : [theme.surface2, theme.surface, theme.inputBg, theme.surface2].map((color, index) => (
                <View
                  key={color + index}
                  className="h-24 w-24 items-center justify-center rounded-2xl border border-hive-stroke"
                  style={{ backgroundColor: color }}
                >
                  <ImageIcon color={theme.textDim} size={24} strokeWidth={2} />
                </View>
              ))}
        </ScrollView>
      )}
    </View>
  );
}

function RecentPhotosGrid({ photoUrls }: { photoUrls: string[] }) {
  const theme = useHiveTheme();

  if (photoUrls.length === 0) {
    return (
      <View className="flex-row px-2" style={{ gap: PHOTO_GAP }}>
        {Array.from({ length: COLUMN_COUNT }, (_, index) => (
          <View
            key={index}
            className="flex-1 items-center justify-center rounded-2xl border border-hive-stroke"
            style={{ aspectRatio: PHOTO_ASPECT_RATIO, backgroundColor: theme.surface2 }}
          >
            <ImageIcon color={theme.textDim} size={24} strokeWidth={2} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="px-2" style={{ gap: PHOTO_GAP }}>
      {chunkItems(photoUrls, COLUMN_COUNT).map((row, rowIndex) => (
        <View key={row.join('-') + rowIndex} className="flex-row" style={{ gap: PHOTO_GAP }}>
          {row.map((uri, index) => (
            <View
              key={`${uri}-${index}`}
              className="flex-1 overflow-hidden rounded-2xl"
              style={{ aspectRatio: PHOTO_ASPECT_RATIO, backgroundColor: theme.surface2 }}
            >
              <Image contentFit="cover" source={{ uri }} style={styles.photo} />
            </View>
          ))}
          {Array.from({ length: COLUMN_COUNT - row.length }, (_, index) => (
            <View key={`spacer-${index}`} className="flex-1" />
          ))}
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
});
