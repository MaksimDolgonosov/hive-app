import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';

const AVATAR_SIZE = 54;

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
    <>
      {displayUri ? (
        <View
          className="overflow-hidden rounded-hive-md"
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
        <LinearGradient
          colors={['#F5A623', '#FF8C00']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="font-inter text-[10px] font-bold text-white">{initials}</Text>
        </LinearGradient>
      )}

      <Text
        className="max-w-[72px] text-center font-inter text-[11px] font-medium text-hive-foreground"
        numberOfLines={1}
      >
        {username}
      </Text>
    </>
  );

  if (!onPress) {
    return <View className="items-center justify-center gap-1 px-3 py-2">{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      className="items-center justify-center gap-1 px-3 py-2"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}
