import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ProfileRecentPhotosProps = {
  photoUrls?: string[];
  onViewAll?: () => void;
};

export function ProfileRecentPhotos({ photoUrls = [], onViewAll }: ProfileRecentPhotosProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const hasPhotos = photoUrls.length > 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-[15px] font-bold text-hive-foreground">
          {t('profile.recentPhotos')}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAll}>
          <Text className="font-inter text-[13px] font-semibold text-hive-primary">
            {t('profile.viewAll')}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {hasPhotos
          ? photoUrls.slice(0, 4).map((uri) => (
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
    </View>
  );
}
