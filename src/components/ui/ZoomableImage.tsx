import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MAX_ZOOM_SCALE = 4;
const RESET_DURATION_MS = 180;
/** Поверх абсолютных оверлеев экрана, пока жест активен. */
const ZOOMED_Z_INDEX = 10;

type ZoomableImageProps = {
  accessibilityLabel: string;
  uri: string;
};

/**
 * Фото с временным приближением двумя пальцами: масштаб держится, пока пальцы на экране,
 * и возвращается к исходному при отпускании. Постоянного состояния зума нет намеренно —
 * иначе экран пришлось бы дополнять сбросом и ограничением границ кадра.
 */
export function ZoomableImage({ accessibilityLabel, uri }: ZoomableImageProps) {
  const [isZooming, setIsZooming] = useState(false);

  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const layoutWidth = useSharedValue(0);
  const layoutHeight = useSharedValue(0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      layoutWidth.value = event.nativeEvent.layout.width;
      layoutHeight.value = event.nativeEvent.layout.height;
    },
    [layoutHeight, layoutWidth],
  );

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onStart((event) => {
        // Фокус относительно центра view — вокруг него и масштабируем.
        focalX.value = event.focalX - layoutWidth.value / 2;
        focalY.value = event.focalY - layoutHeight.value / 2;
        runOnJS(setIsZooming)(true);
      })
      .onUpdate((event) => {
        scale.value = Math.min(MAX_ZOOM_SCALE, Math.max(1, event.scale));
      })
      .onFinalize(() => {
        translateX.value = withTiming(0, { duration: RESET_DURATION_MS });
        translateY.value = withTiming(0, { duration: RESET_DURATION_MS });
        scale.value = withTiming(1, { duration: RESET_DURATION_MS }, (finished) => {
          if (finished) {
            runOnJS(setIsZooming)(false);
          }
        });
      });

    // Сдвиг кадра во время зума. Одним пальцем не перехватываем — там свайп закрытия экрана.
    const pan = Gesture.Pan()
      .minPointers(2)
      .onChange((event) => {
        if (scale.value <= 1) {
          return;
        }

        translateX.value += event.changeX;
        translateY.value += event.changeY;
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [focalX, focalY, layoutHeight, layoutWidth, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentScale = scale.value;

    return {
      transform: [
        { translateX: focalX.value * (1 - currentScale) + translateX.value },
        { translateY: focalY.value * (1 - currentScale) + translateY.value },
        { scale: currentScale },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[{ flex: 1, zIndex: isZooming ? ZOOMED_Z_INDEX : 0 }, animatedStyle]}
        onLayout={handleLayout}
      >
        <Image
          accessibilityLabel={accessibilityLabel}
          contentFit="contain"
          source={{ uri }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </GestureDetector>
  );
}
