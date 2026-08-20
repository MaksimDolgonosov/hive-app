import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

const MARKER_SIZE = 38;
const PRIMARY = '#e1961d';
const SURFACE_STRONG = '#FFFFFFE6';

interface StingMarkerProps {
  sting: Sting;
  onPress?: () => void;
}

export function StingMarker({ sting, onPress }: StingMarkerProps) {
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const { username, avatarUrl } = resolveStingAuthor(sting, currentUser);
  const displayUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;
  const initials = getProfileInitials(username) || '?';
  const innerSize = MARKER_SIZE - 2;

  useEffect(() => {
    setTracksViewChanges(true);

    if (!displayUri) {
      const timer = setTimeout(() => setTracksViewChanges(false), 400);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [displayUri, sting.id]);

  function handleImageLoad() {
    setTimeout(() => setTracksViewChanges(false), 200);
  }

  return (
    <Marker
      coordinate={{
        latitude: sting.location.lat,
        longitude: sting.location.lng,
      }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.shadow}>
        <View style={styles.marker}>
          {displayUri ? (
            <Image
              key={displayUri}
              accessibilityLabel={username}
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: displayUri }}
              style={{
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              }}
              onLoad={handleImageLoad}
            />
          ) : (
            <LinearGradient
              colors={['#F5A623', '#FF8C00']}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="font-inter text-xs font-bold text-white">{initials}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: SURFACE_STRONG,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
