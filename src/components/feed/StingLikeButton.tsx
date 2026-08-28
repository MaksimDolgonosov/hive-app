import { Heart } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { notifyLikeTap } from '@/src/utils/haptics';

const LIKE_COLOR_LIGHT = '#F5A623';
const LIKE_COLOR_DARK = '#bf7600';
const HEART_LIFT_Y = -28;
const HEART_SCALE_PEAK = 1.5;
const HEART_SIZE = 20;
const LIKE_ANIM_MS = 320;

type StingLikeButtonProps = {
  isLiked: boolean;
  reactionsCount: number;
  disabled?: boolean;
  likeLabel: string;
  unlikeLabel: string;
  onPress: () => void;
};

export function StingLikeButton({
  isLiked,
  reactionsCount,
  disabled = false,
  likeLabel,
  unlikeLabel,
  onPress,
}: StingLikeButtonProps) {
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const heartY = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const colorT = useSharedValue(0);
  const animating = useSharedValue(0);

  useEffect(() => {
    if (!isLiked) {
      setIsLikeAnimating(false);
      animating.value = 0;
      heartY.value = 0;
      heartScale.value = 1;
      colorT.value = 0;
    }
  }, [animating, colorT, heartScale, heartY, isLiked]);

  const showLikedButton = isLiked && !isLikeAnimating;

  const heartMotionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heartY.value }, { scale: heartScale.value }],
  }));

  const heartLightLayerStyle = useAnimatedStyle(() => ({
    opacity: animating.value === 1 ? 1 - colorT.value : 0,
  }));

  const heartDarkLayerStyle = useAnimatedStyle(() => ({
    opacity: animating.value === 1 ? colorT.value : 0,
  }));

  const heartIdleLayerStyle = useAnimatedStyle(() => ({
    opacity: animating.value === 1 ? 0 : 1,
  }));

  function playLikeAnimation() {
    setIsLikeAnimating(true);
    animating.value = 1;
    heartY.value = 0;
    heartScale.value = 1;
    colorT.value = 0;

    heartY.value = withSequence(
      withTiming(HEART_LIFT_Y, {
        duration: LIKE_ANIM_MS,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(
        0,
        {
          duration: LIKE_ANIM_MS,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            animating.value = 0;
            runOnJS(setIsLikeAnimating)(false);
          }
        },
      ),
    );

    heartScale.value = withSequence(
      withTiming(HEART_SCALE_PEAK, {
        duration: LIKE_ANIM_MS,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: LIKE_ANIM_MS,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    colorT.value = withSequence(
      withTiming(1, { duration: LIKE_ANIM_MS, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: LIKE_ANIM_MS, easing: Easing.inOut(Easing.ease) }),
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLiked ? unlikeLabel : likeLabel}
      accessibilityState={{ selected: isLiked, disabled }}
      className={`flex-row items-center gap-2 rounded-full px-5 py-3 ${
        showLikedButton ? 'bg-hive-primary' : 'border border-white/30 bg-black/40'
      }`}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!isLiked && !disabled) {
          notifyLikeTap();
          playLikeAnimation();
        }
      }}
    >
      <Animated.View style={[styles.heartBox, heartMotionStyle]}>
        <Animated.View pointerEvents="none" style={[styles.heartLayer, heartLightLayerStyle]}>
          <Heart
            color={LIKE_COLOR_LIGHT}
            fill={LIKE_COLOR_LIGHT}
            size={HEART_SIZE}
            strokeWidth={2}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.heartLayer, heartDarkLayerStyle]}>
          <Heart color={LIKE_COLOR_DARK} fill={LIKE_COLOR_DARK} size={HEART_SIZE} strokeWidth={2} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.heartLayer, heartIdleLayerStyle]}>
          <Heart
            color="#FFFFFF"
            fill={showLikedButton ? '#FFFFFF' : 'transparent'}
            size={HEART_SIZE}
            strokeWidth={2}
          />
        </Animated.View>
      </Animated.View>

      <Text className="font-inter text-base font-semibold text-white">{reactionsCount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heartBox: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  heartLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
