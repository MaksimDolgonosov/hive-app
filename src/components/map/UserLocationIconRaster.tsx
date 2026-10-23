import { useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Image as SvgImage } from 'react-native-svg';

import { captureSvgMarkerIcon } from '@/src/components/map/capture-svg-marker-icon';
import { SEED_FILL } from '@/src/components/map/HiveMarkerFace';

export const USER_LOCATION_ICON_SIZE = 100;
const BORDER = 2;
const BORDER_INSET = BORDER / 2 + 0.5;
const SHADOW_BLUR = 16;
const SHADOW_OFFSET_Y = 6;
const SHADOW_PAD = SHADOW_BLUR + SHADOW_OFFSET_Y;
const CANVAS_SIZE = USER_LOCATION_ICON_SIZE + SHADOW_PAD * 2;
const SHADOW_LAYERS = 7;

type UserLocationIconRasterProps = {
  uri: string;
  onReady: (iconUri: string) => void;
};

/** Круглое фото профиля вне экрана: MapKit ставит на точку только готовый PNG. */
export function UserLocationIconRaster({ uri, onReady }: UserLocationIconRasterProps) {
  const clipId = useId().replace(/:/g, '');
  const svgRef = useRef<Svg>(null);
  const center = CANVAS_SIZE / 2;
  const ringRadius = USER_LOCATION_ICON_SIZE / 2 - BORDER_INSET;
  const clipRadius = ringRadius - BORDER / 2;

  const handleLoad = () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    setTimeout(() => {
      if (svgRef.current !== svg) {
        return;
      }

      void captureSvgMarkerIcon(svg, CANVAS_SIZE).then((iconUri) => {
        if (iconUri && svgRef.current === svg) {
          onReady(iconUri);
        }
      });
    }, 50);
  };

  return (
    <View collapsable={false} pointerEvents="none" style={styles.rasterizer}>
      <Svg
        ref={svgRef}
        height={CANVAS_SIZE}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        width={CANVAS_SIZE}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={center} cy={center} r={clipRadius} />
          </ClipPath>
        </Defs>
        {Array.from({ length: SHADOW_LAYERS }, (_, index) => {
          const spread = (SHADOW_LAYERS - index) / SHADOW_LAYERS;
          return (
            <Circle
              key={index}
              cx={center}
              cy={center + SHADOW_OFFSET_Y * spread}
              fill={SEED_FILL}
              opacity={0.02 + (1 - spread) * 0.045}
              r={ringRadius + spread * SHADOW_BLUR}
            />
          );
        })}
        <SvgImage
          clipPath={`url(#${clipId})`}
          height={USER_LOCATION_ICON_SIZE}
          href={{ uri }}
          preserveAspectRatio="xMidYMid slice"
          width={USER_LOCATION_ICON_SIZE}
          x={SHADOW_PAD}
          y={SHADOW_PAD}
          onLoad={handleLoad}
        />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={ringRadius}
          stroke={SEED_FILL}
          strokeWidth={BORDER}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rasterizer: {
    position: 'absolute',
    left: -1000,
    top: 0,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
});
