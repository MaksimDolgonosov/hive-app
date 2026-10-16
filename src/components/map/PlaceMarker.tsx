import { useEffect, useId, useMemo, useRef, useState, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'expo-yandex-mapkit';
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from 'react-native-svg';

import {
  captureSvgMarkerIcon,
  markerIconScale,
} from '@/src/components/map/capture-svg-marker-icon';
import { SEED_FILL } from '@/src/components/map/HiveMarkerFace';
import type { PlaceSummary } from '@/src/types';
import { getRoundedHexagonPath } from '@/src/utils/hive-hexagon';

export const PLACE_MARKER_SIZE = 100;
const BORDER = 2;

type PlaceMarkerProps = {
  place: PlaceSummary;
  onPress?: () => void;
};

function PlaceMarkerFace({
  coverUrl,
  onImageLoad,
  svgRef,
}: {
  coverUrl: string | null;
  onImageLoad?: () => void;
  svgRef?: Ref<Svg>;
}) {
  const clipId = useId().replace(/:/g, '');
  const path = useMemo(() => getRoundedHexagonPath(PLACE_MARKER_SIZE, 8, BORDER / 2 + 0.5), []);

  return (
    <View collapsable={false} style={styles.root}>
      <Svg
        ref={svgRef}
        height={PLACE_MARKER_SIZE}
        viewBox={`0 0 ${PLACE_MARKER_SIZE} ${PLACE_MARKER_SIZE}`}
        width={PLACE_MARKER_SIZE}
      >
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

export function PlaceMarker({ place, onPress }: PlaceMarkerProps) {
  const svgRef = useRef<Svg>(null);
  const [iconUri, setIconUri] = useState<string | null>(null);
  const coverUrl = place.coverThumbnailUrl;
  const point = { latitude: place.center.lat, longitude: place.center.lng };

  useEffect(() => {
    setIconUri(null);
  }, [coverUrl]);

  const handleImageLoad = () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    setTimeout(() => {
      if (svgRef.current !== svg) {
        return;
      }

      void captureSvgMarkerIcon(svg, PLACE_MARKER_SIZE).then((uri) => {
        if (uri && svgRef.current === svg) {
          setIconUri(uri);
        }
      });
    }, 50);
  };

  if (coverUrl && iconUri) {
    return (
      <Marker
        anchor={{ x: 0.5, y: 0.5 }}
        handled
        point={point}
        scale={markerIconScale()}
        source={{ uri: iconUri }}
        tracksViewChanges={false}
        onPress={onPress}
      />
    );
  }

  return (
    <>
      {coverUrl ? (
        <View collapsable={false} pointerEvents="none" style={styles.rasterizer}>
          <PlaceMarkerFace coverUrl={coverUrl} svgRef={svgRef} onImageLoad={handleImageLoad} />
        </View>
      ) : null}
      <Marker
        anchor={{ x: 0.5, y: 0.5 }}
        handled
        point={point}
        tracksViewChanges={false}
        onPress={onPress}
      >
        <PlaceMarkerFace coverUrl={null} />
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    width: PLACE_MARKER_SIZE,
    height: PLACE_MARKER_SIZE,
  },
  rasterizer: {
    position: 'absolute',
    left: -1000,
    top: 0,
    width: PLACE_MARKER_SIZE,
    height: PLACE_MARKER_SIZE,
  },
});
