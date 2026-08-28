import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Timer } from '@/src/components/ui/Timer';
import type { Sting } from '@/src/types';

const PHOTO_SIZE = 110;
const PHOTO_GAP = 8;

type ProfilePhotoGridProps = {
  stings: Sting[];
  onPressSting: (stingId: string) => void;
};

export function ProfilePhotoGrid({ stings, onPressSting }: ProfilePhotoGridProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap" style={{ gap: PHOTO_GAP }}>
      {stings.map((sting) => (
        <Pressable
          key={sting.id}
          accessibilityRole="button"
          accessibilityLabel={t('sting.photoAlt')}
          onPress={() => onPressSting(sting.id)}
        >
          <View
            className="overflow-hidden rounded-hive-md border border-white/50"
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
          >
            <Image
              contentFit="cover"
              source={{ uri: sting.thumbnailUrl }}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: '#E8E0D4' }}
            />
            <View className="absolute bottom-0 left-0 right-0 bg-black/45 px-1.5 py-1">
              <Timer
                expiresAt={sting.expiresAt}
                className="font-inter text-[10px] font-medium text-white"
              />
            </View>
          </View>
        </Pressable>
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
