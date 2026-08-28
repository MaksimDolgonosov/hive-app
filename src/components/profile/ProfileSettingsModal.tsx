import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OPEN_ANIMATION_MS = 240;
const CLOSE_ANIMATION_MS = 200;

type ProfileSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode | ((requestClose: () => void) => React.ReactNode);
};

export function ProfileSettingsModal({ visible, onClose, children }: ProfileSettingsModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const openProgress = useSharedValue(0);
  const sheetTravel = screenHeight * 0.55;

  useEffect(() => {
    if (!visible) {
      return;
    }

    openProgress.value = 0;
    openProgress.value = withTiming(1, { duration: OPEN_ANIMATION_MS });
  }, [openProgress, visible]);

  function finishClose() {
    onClose();
  }

  function requestClose() {
    openProgress.value = withTiming(0, { duration: CLOSE_ANIMATION_MS }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value * 0.4,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - openProgress.value) * sheetTravel }],
  }));

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={requestClose}>
      <View style={styles.root}>
        <Animated.View pointerEvents="box-none" style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Animated.View
          className="rounded-t-[20px] bg-hive-bg px-5 pt-4"
          style={[{ paddingBottom: insets.bottom + 20 }, sheetAnimatedStyle]}
        >
          {typeof children === 'function' ? children(requestClose) : children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});
