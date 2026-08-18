import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

const PLACEHOLDER_COLORS = ['#FFD54F', '#F5A623', '#FF8C00', '#FFE082'] as const;

type ProfileRecentPhotosProps = {
  photoUrls?: string[];
  onViewAll?: () => void;
};

export function ProfileRecentPhotos({ photoUrls = [], onViewAll }: ProfileRecentPhotosProps) {
  const { t } = useTranslation();
  const hasPhotos = photoUrls.length > 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-lg font-bold text-hive-foreground">
          {t('profile.recentPhotos')}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAll}>
          <Text className="font-inter text-sm font-semibold text-hive-primary">
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
                  width: 90,
                  height: 90,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FFFFFF88',
                  backgroundColor: '#E8E0D4',
                }}
              />
            ))
          : PLACEHOLDER_COLORS.map((color, index) => (
              <View
                key={color + index}
                className="h-[90px] w-[90px] items-center justify-center rounded-xl border border-white/50"
                style={{ backgroundColor: color }}
              >
                <ImageIcon color="#FFFFFFAA" size={24} strokeWidth={2} />
              </View>
            ))}
      </ScrollView>
    </View>
  );
}
