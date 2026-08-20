import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { StingAuthorBadge } from '@/src/components/feed/StingAuthorBadge';
import { Timer } from '@/src/components/ui/Timer';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { formatDistance } from '@/src/utils/geo';
import { openUserProfile } from '@/src/utils/open-user-profile';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

type NearbyCardProps = {
  sting: Sting;
  distanceM: number;
  onPress: () => void;
};

export function NearbyCard({ sting, distanceM, onPress }: NearbyCardProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const author = resolveStingAuthor(sting, currentUser);

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row overflow-hidden rounded-hive-md bg-hive-surface"
      onPress={onPress}
    >
      <Image
        accessibilityLabel={t('sting.photoAlt')}
        contentFit="cover"
        source={{ uri: sting.thumbnailUrl }}
        style={{ width: 96, height: 96, backgroundColor: '#E8E0D4' }}
      />

      <View className="flex-1 justify-center px-3 py-2">
        {sting.comment ? (
          <Text
            className="font-inter text-sm text-hive-foreground"
            numberOfLines={2}
          >
            {sting.comment}
          </Text>
        ) : null}

        <Text
          className={`font-inter text-sm font-semibold text-hive-foreground${sting.comment ? ' mt-1' : ''}`}
        >
          {formatDistance(distanceM)}
        </Text>

        <View className="mt-1 flex-row items-center gap-1">
          <Text className="font-inter text-xs text-hive-muted">{t('sting.expiresIn')}</Text>
          <Timer
            expiresAt={sting.expiresAt}
            className="font-inter text-xs font-medium text-hive-primary"
          />
        </View>

        {sting.reactionsCount > 0 && (
          <View className="mt-1.5 flex-row items-center gap-1">
            <Heart color="#F5A623" fill="#F5A623" size={12} />
            <Text className="font-inter text-xs text-hive-muted">{sting.reactionsCount}</Text>
          </View>
        )}
      </View>

      <StingAuthorBadge
        avatarCacheVersion={avatarCacheVersion}
        avatarUrl={author.avatarUrl}
        username={author.username}
        onPress={() => openUserProfile(sting.authorId, currentUser?.id)}
      />
    </Pressable>
  );
}
