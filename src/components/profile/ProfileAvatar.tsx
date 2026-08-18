import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

type ProfileAvatarProps = {
  username: string;
  avatarUrl: string | null;
  size?: number;
};

export function getProfileInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfileAvatar({ username, avatarUrl, size = 80 }: ProfileAvatarProps) {
  const initials = getProfileInitials(username) || '?';
  const fontSize = Math.round(size * 0.35);

  if (avatarUrl) {
    return (
      <View
        className="overflow-hidden rounded-full border-[3px] border-white"
        style={{ width: size, height: size }}
      >
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#F5A623', '#FF8C00']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="font-inter font-bold text-white" style={{ fontSize }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}
