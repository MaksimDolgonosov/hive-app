import { Hexagon } from 'lucide-react-native';
import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const DEFAULT_COLOR = '#FFB800';
const DEFAULT_DURATION_MS = 1400;

const SIZE_MAP = {
  small: 22,
  large: 40,
} as const;

type HiveLoaderSize = keyof typeof SIZE_MAP | number;

type HiveLoaderProps = {
  size?: HiveLoaderSize;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function resolveSize(size: HiveLoaderSize): number {
  return typeof size === 'number' ? size : SIZE_MAP[size];
}

function resolveStrokeWidth(size: number, strokeWidth?: number): number {
  if (strokeWidth !== undefined) {
    return strokeWidth;
  }

  return Math.max(1.5, (size / 88) * 3);
}

export function HiveLoader({
  size = 'large',
  color = DEFAULT_COLOR,
  strokeWidth,
  style,
}: HiveLoaderProps) {
  const rotation = useSharedValue(0);
  const resolvedSize = resolveSize(size);
  const resolvedStrokeWidth = resolveStrokeWidth(resolvedSize, strokeWidth);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: DEFAULT_DURATION_MS, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Hexagon color={color} size={resolvedSize} strokeWidth={resolvedStrokeWidth} />
    </Animated.View>
  );
}
