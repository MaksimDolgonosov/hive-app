import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import { SEED_FILL } from '@/src/components/map/HiveMarkerFace';
import type { PlaceSummary } from '@/src/types';
import { getRoundedHexagonPath } from '@/src/utils/hive-hexagon';

export const PLACE_MARKER_SIZE = 52;
const BORDER = 2;

type PlaceMarkerProps = {
  place: PlaceSummary;
  imageUri?: string | null;
  onPress?: () => void;
};

type PlaceMarkerCaptureProps = {
  placeId: string;
  coverUrl: string | null;
  onCaptured: (placeId: string, uri: string) => void;
};

function PlaceMarkerFace({
  coverUrl,
  onImageLoad,
}: {
  coverUrl: string | null;
  onImageLoad?: () => void;
}) {
  const clipId = useId().replace(/:/g, '');
  const path = useMemo(() => getRoundedHexagonPath(PLACE_MARKER_SIZE, 8, BORDER / 2 + 0.5), []);

  return (
    <View collapsable={false} style={styles.root}>
      <Svg height={PLACE_MARKER_SIZE} width={PLACE_MARKER_SIZE}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={path} />
          </ClipPath>
        </Defs>
        {coverUrl ? (
          <SvgImage
            clipPath={`url(#${clipId})`}
            height={PLACE_MARKER_SIZE}
            href={{ uri: coverUrl }}
            preserveAspectRatio="xMidYMid slice"
            width={PLACE_MARKER_SIZE}
            onLoad={onImageLoad}
          />
        ) : (
          <Path d={path} fill="#C4B49A" />
        )}
        <Path d={path} fill="none" stroke={SEED_FILL} strokeLinejoin="round" strokeWidth={BORDER} />
      </Svg>
    </View>
  );
}

export function PlaceMarkerCapture({ placeId, coverUrl, onCaptured }: PlaceMarkerCaptureProps) {
  const viewRef = useRef<View>(null);

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
      onCaptured(placeId, uri);
    } catch {
      // Повторим, когда обложка догрузится.
    }
  }, [onCaptured, placeId]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        void capture();
      },
      coverUrl ? 200 : 80,
    );

    return () => clearTimeout(timer);
  }, [capture, coverUrl]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.offscreen}
      onLayout={() => {
        if (!coverUrl) {
          void capture();
        }
      }}
    >
      <PlaceMarkerFace
        coverUrl={coverUrl}
        onImageLoad={() => {
          void capture();
        }}
      />
    </View>
  );
}

export function PlaceMarker({ place, imageUri, onPress }: PlaceMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(timer);
  }, [place.coverThumbnailUrl]);

  const coordinate = {
    latitude: place.center.lat,
    longitude: place.center.lng,
  };

  // На Android New Architecture кастомный View в Marker снимается в bitmap ~100px
  // и шестиугольник обрезается. Тот же обход, что у улья и жала: готовый png.
  if (Platform.OS === 'android') {
    if (!imageUri) {
      return null;
    }

    return (
      <Marker
        anchor={{ x: 0.5, y: 0.5 }}
        coordinate={coordinate}
        image={{ uri: imageUri, width: PLACE_MARKER_SIZE, height: PLACE_MARKER_SIZE }}
        tracksViewChanges={false}
        onPress={onPress}
      />
    );
  }

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={coordinate}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <PlaceMarkerFace coverUrl={place.coverThumbnailUrl} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  root: {
    width: PLACE_MARKER_SIZE,
    height: PLACE_MARKER_SIZE,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: PLACE_MARKER_SIZE,
    height: PLACE_MARKER_SIZE,
    opacity: 0,
  },
});
