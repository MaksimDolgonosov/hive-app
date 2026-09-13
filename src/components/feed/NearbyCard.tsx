import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Heart, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { StingAuthorBadge } from '@/src/components/feed/StingAuthorBadge';
import { Timer } from '@/src/components/ui/Timer';
import { useAuthStore } from '@/src/stores/authStore';
import { HiveGradients, HiveTheme } from '@/src/theme/tokens';
import type { Sting } from '@/src/types';
import { formatDistance } from '@/src/utils/geo';
import { openUserProfile } from '@/src/utils/open-user-profile';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

type NearbyCardProps = {
  sting: Sting;
  distanceM: number;
  onPress: () => void;
  onAuthorPress?: (authorId: string) => void;
};

export function NearbyCard({ sting, distanceM, onPress, onAuthorPress }: NearbyCardProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const author = resolveStingAuthor(sting, currentUser);

  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-[22px] bg-hive-surface"
      onPress={onPress}
    >
      <View className="h-[196px]">
        <Image
          accessibilityLabel={t('sting.photoAlt')}
          contentFit="cover"
          source={{ uri: sting.thumbnailUrl }}
          style={{ width: '100%', height: '100%', backgroundColor: HiveTheme.surface2 }}
        />
        <LinearGradient
          colors={[...HiveGradients.photoOverlay]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }}
        />

        <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-[13px] bg-black/65 px-2.5 py-1.5">
          <MapPin color="#F6F2EA" size={12} strokeWidth={2.25} />
          <Text className="font-inter text-xs font-medium text-[#F6F2EA]">
            {formatDistance(distanceM)}
          </Text>
        </View>

        <View className="absolute right-3 top-3 flex-row items-center gap-1.5 rounded-[13px] bg-black/65 px-2.5 py-1.5">
          <Clock color={HiveTheme.accent} size={12} strokeWidth={2.25} />
          <Timer
            expiresAt={sting.expiresAt}
            className="font-inter text-xs font-semibold text-hive-primary"
          />
        </View>

        <View className="absolute bottom-3 left-3 right-3 gap-1.5">
          {sting.comment ? (
            <Text
              className="font-display text-[18px] font-bold text-[#F6F2EA]"
              numberOfLines={1}
            >
              {sting.comment}
            </Text>
          ) : null}

          <View className="flex-row items-center justify-between">
            <StingAuthorBadge
              avatarCacheVersion={avatarCacheVersion}
              avatarUrl={author.avatarUrl}
              username={author.username}
              onPress={() => {
                if (onAuthorPress) {
                  onAuthorPress(sting.authorId);
                  return;
                }

                openUserProfile(sting.authorId, currentUser?.id);
              }}
            />

            {sting.reactionsCount > 0 ? (
              <View className="flex-row items-center gap-1">
                <Heart color={HiveTheme.accent} fill={HiveTheme.accent} size={13} />
                <Text className="font-inter text-xs text-[#9C9287]">{sting.reactionsCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
