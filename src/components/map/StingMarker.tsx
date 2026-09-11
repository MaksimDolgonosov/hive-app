import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';

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
  imageUri?: string | null;
}

interface StingMarkerCaptureProps {
  sting: Sting;
  onCaptured: (stingId: string, uri: string) => void;
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
          <Text className="font-display text-xs font-bold text-hive-on-accent">{initials}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

export function StingMarkerCapture({ sting, onCaptured }: StingMarkerCaptureProps) {
  const viewRef = useRef<View>(null);
  const { username, displayUri, initials } = useStingMarkerVisual(sting);

  const capture = useCallback(async () => {
    if (!viewRef.current) {
      return;
    }

    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      onCaptured(sting.id, uri);
    } catch {
      // Повторим на следующем layout/таймере.
    }
  }, [onCaptured, sting.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void capture();
    }, displayUri ? 200 : 80);

    return () => clearTimeout(timer);
  }, [capture, displayUri]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.offscreen}
      onLayout={() => {
        if (!displayUri) {
          void capture();
        }
      }}
    >
      <StingMarkerFace
        displayUri={displayUri}
        initials={initials}
        username={username}
        onImageLoad={() => {
          void capture();
        }}
      />
    </View>
  );
}

export function StingMarker({ sting, onPress, imageUri }: StingMarkerProps) {
  const { username, displayUri, initials } = useStingMarkerVisual(sting);
  const { tracksViewChanges, handleLayout } = useMapMarkerTracking(
    `${sting.id}:${displayUri ?? 'initials'}`,
  );

  const coordinate = {
    latitude: sting.location.lat,
    longitude: sting.location.lng,
  };

  // На Android New Architecture кастомный View в Marker снимается в bitmap ~100px
  // и кружок обрезается на физических экранах высокой плотности.
  if (Platform.OS === 'android') {
    if (!imageUri) {
      return null;
    }

    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        image={{ uri: imageUri, width: STING_MARKER_SIZE, height: STING_MARKER_SIZE }}
        tracksViewChanges={false}
        onPress={onPress}
      />
    );
  }

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
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
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: STING_MARKER_SIZE,
    height: STING_MARKER_SIZE,
    opacity: 0,
  },
});
