import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

const FALLBACK_COLORS = ['#FFB800', '#C6F24E', '#FF7A45', '#7DD3FC'] as const;
const DEFAULT_SIZE = 22;
const DEFAULT_MAX = 5;
const OVERLAP_RATIO = 0.25;

type HiveContributorAvatarsProps = {
  stings: Sting[];
  size?: number;
  max?: number;
  ringColor?: string;
};

export function HiveContributorAvatars({
  stings,
  size = DEFAULT_SIZE,
  max = DEFAULT_MAX,
  ringColor,
}: HiveContributorAvatarsProps) {
  const theme = useHiveTheme();
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const borderColor = ringColor ?? theme.surface;
  const overlap = size * OVERLAP_RATIO;

  const contributors = useMemo(() => {
    const seen = new Set<string>();
    const unique: { authorId: string; username: string; avatarUrl: string | null }[] = [];

    for (const sting of stings) {
      if (seen.has(sting.authorId)) {
        continue;
      }

      seen.add(sting.authorId);
      const author = resolveStingAuthor(sting, currentUser);
      unique.push({
        authorId: sting.authorId,
        username: author.username,
        avatarUrl: author.avatarUrl,
      });

      if (unique.length >= max) {
        break;
      }
    }

    return unique;
  }, [currentUser, max, stings]);

  if (contributors.length === 0) {
    return null;
  }

  return (
    <View className="flex-row items-center">
      {contributors.map((contributor, index) => {
        const initials = getProfileInitials(contributor.username).slice(0, 1) || '?';
        const displayUri = contributor.avatarUrl
          ? buildAvatarDisplayUri(contributor.avatarUrl, avatarCacheVersion)
          : null;

        return (
          <View
            key={contributor.authorId}
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: index + 1,
              backgroundColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
              borderWidth: 1.5,
              borderColor,
            }}
          >
            {displayUri ? (
              <Image
                accessibilityLabel={contributor.username}
                contentFit="cover"
                source={{ uri: displayUri }}
                style={{ width: size, height: size }}
              />
            ) : (
              <Text className="font-inter text-[9px] font-bold text-hive-on-accent">
                {initials}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
