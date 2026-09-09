import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { HiveTheme } from '@/src/theme/tokens';

const AVATAR_SIZE = 22;

type StingAuthorBadgeProps = {
  username: string;
  avatarUrl: string | null;
  avatarCacheVersion?: number;
  onPress?: () => void;
};

export function StingAuthorBadge({
  username,
  avatarUrl,
  avatarCacheVersion = 0,
  onPress,
}: StingAuthorBadgeProps) {
  const displayUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;
  const initials = getProfileInitials(username) || '?';

  const content = (
    <View className="flex-row items-center gap-2">
      {displayUri ? (
        <View
          className="overflow-hidden rounded-full"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
        >
          <Image
            accessibilityLabel={username}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: displayUri }}
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          />
        </View>
      ) : (
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            backgroundColor: HiveTheme.accent,
          }}
        >
          <Text className="font-display text-[9px] font-bold text-hive-on-accent">{initials}</Text>
        </View>
      )}

      <Text
        className="max-w-[140px] font-inter text-[12px] font-medium text-[#F6F2EA]"
        numberOfLines={1}
      >
        {username}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      {content}
    </Pressable>
  );
}
