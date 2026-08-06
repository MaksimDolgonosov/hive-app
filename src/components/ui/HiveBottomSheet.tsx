import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Timer } from '@/src/components/ui/Timer';
import { useHiveDetail } from '@/src/hooks/useHiveDetail';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import type { Sting } from '@/src/types';

type HiveBottomSheetProps = {
  hiveId: string;
  onClose: () => void;
};

const THUMBNAIL_GAP = 10;
const THUMBNAIL_COLUMNS = 3;

function HiveStingThumbnail({ sting, size, onPress }: { sting: Sting; size: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ width: size, marginBottom: THUMBNAIL_GAP }}
    >
      <Image
        contentFit="cover"
        source={{ uri: sting.thumbnailUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: '#E8E0D4',
        }}
      />
      <Timer
        expiresAt={sting.expiresAt}
        className="mt-1 text-center font-inter text-xs text-hive-muted"
      />
    </Pressable>
  );
}

export function HiveBottomSheet({ hiveId, onClose }: HiveBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { data, isLoading, isError } = useHiveDetail(hiveId);

  const sheetPadding = 16;
  const thumbnailSize =
    (Math.min(screenWidth, 358) - sheetPadding * 2 - THUMBNAIL_GAP * (THUMBNAIL_COLUMNS - 1)) /
    THUMBNAIL_COLUMNS;

  function openSting(stingId: string) {
    onClose();
    router.push(`/(modals)/sting/${stingId}` as Href);
  }

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <Pressable accessibilityRole="button" className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-[28px] bg-hive-surface px-4 pt-3"
          style={{ paddingBottom: getGlassTabBarInset(insets.bottom) + 8 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-hive-muted/30" />

          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="font-inter text-lg font-semibold text-hive-foreground">
                {t('hive.title')}
              </Text>
              <Text className="font-inter text-sm text-hive-muted">
                {t('hive.photoCount', { count: data?.stings.length ?? 0 })}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('hive.close')}
              className="h-9 w-9 items-center justify-center rounded-full bg-hive-bg"
              onPress={onClose}
            >
              <X color="#8B7355" size={20} />
            </Pressable>
          </View>

          {isLoading && (
            <View className="items-center py-10">
              <ActivityIndicator color="#F5A623" size="large" />
            </View>
          )}

          {isError && (
            <Text className="py-8 text-center font-inter text-sm text-hive-muted">
              {t('hive.loadError')}
            </Text>
          )}

          {data && data.stings.length === 0 && (
            <Text className="py-8 text-center font-inter text-sm text-hive-muted">
              {t('hive.empty')}
            </Text>
          )}

          {data && data.stings.length > 0 && (
            <FlatList
              columnWrapperStyle={{ gap: THUMBNAIL_GAP }}
              contentContainerStyle={{ paddingBottom: 8 }}
              data={data.stings}
              keyExtractor={(item) => item.id}
              numColumns={THUMBNAIL_COLUMNS}
              renderItem={({ item }) => (
                <HiveStingThumbnail
                  size={thumbnailSize}
                  sting={item}
                  onPress={() => openSting(item.id)}
                />
              )}
              scrollEnabled={data.stings.length > 6}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
