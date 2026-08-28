import { router, type Href } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  FlatList as GestureFlatList,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearbyCard } from '@/src/components/feed/NearbyCard';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useHiveDetail } from '@/src/hooks/useHiveDetail';
import { useLocation } from '@/src/hooks/useLocation';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { haversineDistance } from '@/src/utils/geo';
import { openUserProfile } from '@/src/utils/open-user-profile';

type HiveBottomSheetProps = {
  hiveId: string;
  onClose: () => void;
};

type HiveStingListItem = {
  sting: Sting;
  distanceM: number;
};

const DISMISS_THRESHOLD = 100;
const DISMISS_VELOCITY = 800;
const OPEN_ANIMATION_MS = 240;
const BACKDROP_FADE_DISTANCE = 220;

const AnimatedFlatList = Animated.createAnimatedComponent(GestureFlatList<HiveStingListItem>);

function createDismissPanGesture({
  translateY,
  scrollY,
  screenHeight,
  onClose,
  requireScrollTop,
}: {
  translateY: SharedValue<number>;
  scrollY: SharedValue<number>;
  screenHeight: number;
  onClose: () => void;
  requireScrollTop: boolean;
}) {
  return Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .onUpdate((event) => {
      const canDismiss = !requireScrollTop || scrollY.value < 1;

      if (canDismiss && event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldDismiss =
        translateY.value > DISMISS_THRESHOLD || event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        translateY.value = withTiming(screenHeight * 0.45, { duration: 220 }, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
        return;
      }

      translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
    });
}

export function HiveBottomSheet({ hiveId, onClose }: HiveBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { coords } = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useHiveDetail(hiveId);

  const maxSheetHeight = screenHeight * 0.72;
  const listMaxHeight = maxSheetHeight - 120;

  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const openProgress = useSharedValue(0);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    translateY.value = 0;
    scrollY.value = 0;
    openProgress.value = 0;
    openProgress.value = withTiming(1, { duration: OPEN_ANIMATION_MS });
  }, [hiveId, openProgress, scrollY, translateY]);

  const stingsWithDistance = useMemo(() => {
    if (!data?.stings) {
      return [];
    }

    const origin = coords
      ? { lat: coords.latitude, lng: coords.longitude }
      : data.hive.center;

    return data.stings.map((sting) => ({
      sting,
      distanceM: haversineDistance(origin, sting.location),
    }));
  }, [coords, data?.hive.center, data?.stings]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const listScrollGesture = useMemo(() => Gesture.Native(), []);

  const headerPanGesture = useMemo(
    () =>
      createDismissPanGesture({
        translateY,
        scrollY,
        screenHeight,
        onClose: handleClose,
        requireScrollTop: false,
      }),
    [handleClose, screenHeight, scrollY, translateY],
  );

  const contentPanGesture = useMemo(
    () =>
      createDismissPanGesture({
        translateY,
        scrollY,
        screenHeight,
        onClose: handleClose,
        requireScrollTop: true,
      }).simultaneousWithExternalGesture(listScrollGesture),
    [handleClose, listScrollGesture, screenHeight, scrollY, translateY],
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          translateY.value + (1 - openProgress.value) * maxSheetHeight,
      },
    ],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value * (1 - Math.min(translateY.value / BACKDROP_FADE_DISTANCE, 1)),
  }));

  function openSting(stingId: string) {
    handleClose();

    const navigate = () => {
      router.push(`/(modals)/sting/${stingId}` as Href);
    };

    if (Platform.OS === 'ios') {
      requestAnimationFrame(navigate);
      return;
    }

    navigate();
  }

  function openAuthorProfile(authorId: string) {
    handleClose();

    const navigate = () => {
      openUserProfile(authorId, currentUser?.id);
    };

    if (Platform.OS === 'ios') {
      requestAnimationFrame(navigate);
      return;
    }

    navigate();
  }

  function renderSting({ item }: { item: HiveStingListItem }) {
    return (
      <NearbyCard
        distanceM={item.distanceM}
        sting={item.sting}
        onAuthorPress={openAuthorProfile}
        onPress={() => openSting(item.sting.id)}
      />
    );
  }

  return (
    <Modal animationType="none" transparent visible onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View pointerEvents="box-none" style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="rounded-t-[28px] bg-hive-surface px-4 pt-3"
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              paddingBottom: insets.bottom,
            },
            sheetAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={headerPanGesture}>
            <View style={styles.dragZone}>
              <View className="mb-4 h-1 w-10 self-center rounded-full bg-hive-muted/30" />

              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="font-inter text-lg font-semibold text-hive-foreground">
                    {t('hive.title')}
                  </Text>
                  <Text className="font-inter text-sm text-hive-muted">
                    {t('hive.photoCount', { count: data?.stings.length ?? 0 })}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hive.close')}
                  className="h-9 w-9 items-center justify-center rounded-full bg-hive-bg"
                  onPress={onClose}
                >
                  <X color="#8B7355" size={20} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <GestureDetector gesture={contentPanGesture}>
            <View>
              {isLoading && (
                <View className="items-center py-10">
                  <HiveLoader size="large" />
                </View>
              )}

              {isError && (
                <Text className="py-8 text-center font-inter text-sm text-hive-muted">
                  {t('hive.loadError')}
                </Text>
              )}

              {data && data.stings.length === 0 && (
                <Text className="py-8 text-center font-inter text-sm text-hive-muted">
                  {t('hive.empty')}
                </Text>
              )}

              {stingsWithDistance.length > 0 && (
                <GestureDetector gesture={listScrollGesture}>
                  <AnimatedFlatList
                    bounces
                    contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
                    data={stingsWithDistance}
                    keyExtractor={(item) => item.sting.id}
                    nestedScrollEnabled
                    renderItem={renderSting}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: listMaxHeight }}
                    onScroll={scrollHandler}
                  />
                </GestureDetector>
              )}
            </View>
          </GestureDetector>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dragZone: {
    paddingTop: 4,
    paddingBottom: 4,
  },
});
