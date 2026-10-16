import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'expo-yandex-mapkit';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { useMapMarkerTracking } from '@/src/hooks/useMapMarkerTracking';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

export const STING_MARKER_SIZE = 44;
const INNER_SIZE = STING_MARKER_SIZE - 2;
const PRIMARY = '#FFB800';
const SURFACE_STRONG = '#201C16';

interface StingMarkerProps {
  sting: Sting;
  onPress?: () => void;
}

function useStingMarkerVisual(sting: Sting) {
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const { username, avatarUrl } = resolveStingAuthor(sting, currentUser);
  const displayUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;
  const initials = getProfileInitials(username) || '?';

  return { username, displayUri, initials };
}

function StingMarkerFace({
  username,
  displayUri,
  initials,
  onImageLoad,
}: {
  username: string;
  displayUri: string | null;
  initials: string;
  onImageLoad?: () => void;
}) {
  return (
    <View collapsable={false} style={styles.marker}>
      {displayUri ? (
        <Image
          key={displayUri}
          accessibilityLabel={username}
          resizeMode="cover"
          source={{ uri: displayUri }}
          style={styles.photo}
          onLoad={onImageLoad}
        />
      ) : (
        <LinearGradient
          colors={['#FFB800', '#E5A400']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.fallback}
        >
          <Text className="font-semibold font-display text-xs text-hive-on-accent">{initials}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

export function StingMarker({ sting, onPress }: StingMarkerProps) {
  const { username, displayUri, initials } = useStingMarkerVisual(sting);
  const { tracksViewChanges, handleLayout } = useMapMarkerTracking(
    `${sting.id}:${displayUri ?? 'initials'}`,
  );

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      handled
      point={{ latitude: sting.location.lat, longitude: sting.location.lng }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <View collapsable={false} onLayout={handleLayout} style={styles.shadow}>
        <StingMarkerFace
          displayUri={displayUri}
          initials={initials}
          username={username}
          onImageLoad={handleLayout}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: STING_MARKER_SIZE,
    height: STING_MARKER_SIZE,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  marker: {
    width: STING_MARKER_SIZE,
    height: STING_MARKER_SIZE,
    borderRadius: STING_MARKER_SIZE / 2,
    backgroundColor: SURFACE_STRONG,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
  },
  fallback: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
