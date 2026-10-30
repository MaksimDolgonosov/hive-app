import { Marker } from 'expo-yandex-mapkit';
import { useEffect, useId, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from 'react-native-svg';

import { SEED_FILL } from '@/src/components/map/HiveMarkerFace';
import type { PlaceSummary } from '@/src/types';
import { getRoundedHexagonPath } from '@/src/utils/hive-hexagon';

/** Сота места в тех же пунктах, что и маркер тусовки, а не полноразмерный кадр обложки. */
export const PLACE_MARKER_SIZE = 56;
const BORDER = 1.5;
const CORNER_RADIUS = 6;

type PlaceMarkerProps = {
  place: PlaceSummary;
  onPress?: () => void;
};

function PlaceMarkerFace({
  coverUrl,
  onImageLoad,
}: {
  coverUrl: string | null;
  onImageLoad?: () => void;
}) {
  const clipId = useId().replace(/:/g, '');
  const path = useMemo(
    () => getRoundedHexagonPath(PLACE_MARKER_SIZE, CORNER_RADIUS, BORDER / 2 + 0.5),
    [],
  );
  const [coverLaidOut, setCoverLaidOut] = useState(!coverUrl);

  useEffect(() => {
    setCoverLaidOut(!coverUrl);
  }, [coverUrl]);

  return (
    <View
      collapsable={false}
      style={[
        styles.root,
        { width: PLACE_MARKER_SIZE + (coverUrl && !coverLaidOut ? 1 : 0) },
      ]}
    >
      <Svg
        height={PLACE_MARKER_SIZE}
        viewBox={`0 0 ${PLACE_MARKER_SIZE} ${PLACE_MARKER_SIZE}`}
        width={PLACE_MARKER_SIZE}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={path} />
          </ClipPath>
        </Defs>
        <Path d={path} fill="#C4B49A" />
        {coverUrl ? (
          <SvgImage
            clipPath={`url(#${clipId})`}
            height={PLACE_MARKER_SIZE}
            href={{ uri: coverUrl }}
            preserveAspectRatio="xMidYMid slice"
            width={PLACE_MARKER_SIZE}
            onLoad={() => {
              setCoverLaidOut(true);
              onImageLoad?.();
            }}
          />
        ) : null}
        <Path d={path} fill="none" stroke={SEED_FILL} strokeLinejoin="round" strokeWidth={BORDER} />
      </Svg>
    </View>
  );
}

export function PlaceMarker({ place, onPress }: PlaceMarkerProps) {
  const coverUrl = place.coverThumbnailUrl;
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const point = { latitude: place.center.lat, longitude: place.center.lng };

  useEffect(() => {
    setTracksViewChanges(true);
    if (!coverUrl) {
      const timer = setTimeout(() => setTracksViewChanges(false), 400);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    const stop = setTimeout(() => {
      if (!cancelled) {
        setTracksViewChanges(false);
      }
    }, 2500);

    void Image.prefetch(coverUrl).then((loaded) => {
      if (cancelled || !loaded) {
        return;
      }

      setTimeout(() => {
        if (cancelled) {
          return;
        }

        setTracksViewChanges(true);
        setTimeout(() => {
          if (!cancelled) {
            setTracksViewChanges(false);
          }
        }, 450);
      }, 100);
    });

    return () => {
      cancelled = true;
      clearTimeout(stop);
    };
  }, [coverUrl]);

  const handleImageLoad = () => {
    setTracksViewChanges(true);
    setTimeout(() => setTracksViewChanges(false), 450);
  };

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      handled
      point={point}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <PlaceMarkerFace coverUrl={coverUrl} onImageLoad={coverUrl ? handleImageLoad : undefined} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  root: {
    height: PLACE_MARKER_SIZE,
  },
});
