import { Image } from 'expo-image';
import { Marker } from 'expo-yandex-mapkit';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';

const SIZE = 46;

/** Своя точка на карте. Слой геопозиции MapKit рисует зелёный кружок «Я», его не используем. */
export function UserLocationMarker() {
  const latitude = useLocationStore(
    (state) => state.coords?.latitude ?? state.lastKnownCoords?.latitude,
  );
  const longitude = useLocationStore(
    (state) => state.coords?.longitude ?? state.lastKnownCoords?.longitude,
  );
  const username = useAuthStore((state) => state.user?.username ?? '');
  const avatarUrl = useAuthStore((state) => state.user?.avatarUrl ?? null);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const avatarUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;
  const initials = getProfileInitials(username) || '?';
  const [photoReady, setPhotoReady] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setPhotoReady(false);
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), avatarUri ? 2500 : 400);
    return () => clearTimeout(timer);
  }, [avatarUri]);

  const handleLoad = () => {
    setTimeout(() => {
      setPhotoReady(true);
      setTracksViewChanges(true);
      setTimeout(() => setTracksViewChanges(false), 600);
    }, 60);
  };

  if (latitude == null || longitude == null) {
    return null;
  }

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      point={{ latitude, longitude }}
      tracksViewChanges={tracksViewChanges}
      zIndex={10}
    >
      {avatarUri ? (
        <Image
          key={avatarUri}
          accessibilityLabel={username}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: avatarUri }}
          style={[styles.photo, !photoReady ? styles.photoPending : null]}
          transition={0}
          onLoad={handleLoad}
        />
      ) : (
        <View collapsable={false} style={styles.photo}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: '#B99A55',
    backgroundColor: '#F4E2B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPending: {
    width: SIZE + 1,
  },
  initials: {
    color: '#1A1408',
    fontSize: 16,
    fontWeight: '600',
  },
});
