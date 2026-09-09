import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Camera, Clock, X } from 'lucide-react-native';
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
  ScrollView as GestureScrollView,
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

import { HiveSheetBento } from '@/src/components/map/HiveSheetBento';
import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useCountdown } from '@/src/hooks/useCountdown';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useHiveDetail } from '@/src/hooks/useHiveDetail';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import type { Sting, User } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { haversineDistance } from '@/src/utils/geo';
import { openUserProfile } from '@/src/utils/open-user-profile';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';

type HiveBottomSheetProps = {
  hiveId: string;
  onClose: () => void;
};

const DISMISS_THRESHOLD = 100;
const DISMISS_VELOCITY = 800;
const OPEN_ANIMATION_MS = 240;
const BACKDROP_FADE_DISTANCE = 220;
const CONTRIBUTOR_COLORS = ['#FFB800', '#C6F24E', '#FF7A45'] as const;

const AnimatedScrollView = Animated.createAnimatedComponent(GestureScrollView);

type HiveContributor = {
  authorId: string;
  username: string;
  avatarUrl: string | null;
};

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

function collectContributors(
  stings: Sting[],
  currentUser: Pick<User, 'id' | 'username' | 'avatarUrl'> | null,
): HiveContributor[] {
  const contributors: HiveContributor[] = [];
  const seen = new Set<string>();

  for (const sting of stings) {
    if (seen.has(sting.authorId)) {
      continue;
    }

    seen.add(sting.authorId);
    const author = resolveStingAuthor(sting, currentUser);
    contributors.push({
      authorId: sting.authorId,
      username: author.username,
      avatarUrl: author.avatarUrl,
    });
  }

  return contributors;
}

export function HiveBottomSheet({ hiveId, onClose }: HiveBottomSheetProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const liveCoords = useLocationStore((state) => state.coords);
  const lastKnownCoords = useLocationStore((state) => state.lastKnownCoords);
  const { data, isLoading, isError } = useHiveDetail(hiveId);

  const maxSheetHeight = screenHeight * 0.78;

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

  const stingsNewestFirst = useMemo(() => {
    if (!data?.stings) {
      return [];
    }

    return [...data.stings].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [data?.stings]);

  const isInsideHive = useMemo(() => {
    const hive = data?.hive;
    if (!hive) {
      return false;
    }

    const userPoint = liveCoords
      ? { lat: liveCoords.latitude, lng: liveCoords.longitude }
      : lastKnownCoords
        ? { lat: lastKnownCoords.latitude, lng: lastKnownCoords.longitude }
        : null;

    if (!userPoint) {
      return false;
    }

    return haversineDistance(userPoint, hive.center) <= hive.radiusM;
  }, [data?.hive, lastKnownCoords, liveCoords]);

  const listMaxHeight = maxSheetHeight - (isInsideHive ? 220 : 160);

  const hiveExpiresAt = useMemo(() => {
    if (stingsNewestFirst.length === 0) {
      return null;
    }

    return stingsNewestFirst.reduce(
      (latest, sting) => (sting.expiresAt > latest ? sting.expiresAt : latest),
      stingsNewestFirst[0].expiresAt,
    );
  }, [stingsNewestFirst]);

  const hiveLifetimeMs = useMemo(() => {
    if (!hiveExpiresAt) {
      return 1;
    }

    const source =
      stingsNewestFirst.find((sting) => sting.expiresAt === hiveExpiresAt) ?? stingsNewestFirst[0];
    const createdMs = new Date(source.createdAt).getTime();
    const expiresMs = new Date(hiveExpiresAt).getTime();

    return Math.max(expiresMs - createdMs, 1);
  }, [hiveExpiresAt, stingsNewestFirst]);

  const countdown = useCountdown(hiveExpiresAt ?? new Date().toISOString());
  const dissolveProgress = hiveExpiresAt ? Math.min(1, countdown.remainingMs / hiveLifetimeMs) : 0;

  const contributors = useMemo(
    () => collectContributors(stingsNewestFirst, currentUser),
    [currentUser, stingsNewestFirst],
  );

  const contributorLabel = useMemo(() => {
    if (contributors.length === 0) {
      return '';
    }

    if (contributors.length === 1) {
      return contributors[0].username;
    }

    if (contributors.length === 2) {
      return t('hive.contributorsTwo', {
        name1: contributors[0].username,
        name2: contributors[1].username,
      });
    }

    return t('hive.contributorsMany', {
      name1: contributors[0].username,
      name2: contributors[1].username,
      count: contributors.length - 2,
    });
  }, [contributors, t]);

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
        translateY: translateY.value + (1 - openProgress.value) * maxSheetHeight,
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

  function openCamera() {
    handleClose();

    const navigate = () => {
      router.push('/(modals)/camera' as Href);
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

  const photoCount = data?.stings.length ?? 0;

  return (
    <Modal animationType="none" transparent visible onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View pointerEvents="box-none" style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="overflow-hidden rounded-t-[30px] px-5 pt-3"
          style={[
            styles.sheet,
            colorScheme === 'dark' ? { backgroundColor: theme.surface } : null,
            {
              maxHeight: maxSheetHeight,
              paddingBottom: insets.bottom + 16,
            },
            sheetAnimatedStyle,
          ]}
        >
          {colorScheme === 'light' ? (
            <LinearGradient
              colors={[...theme.gradients.authGlow]}
              end={{ x: 0.5, y: 1 }}
              locations={[0, 0.5, 1]}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <GestureDetector gesture={headerPanGesture}>
            <View className="gap-[18px] pb-1">
              <View className="items-center pt-1">
                <View className="h-1 w-[42px] rounded-full bg-hive-foreground/20" />
              </View>

              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-1 gap-1.5">
                  <Text className="font-display text-2xl font-bold text-hive-foreground">
                    {t('hive.title')}
                  </Text>
                  <Text className="font-inter text-[13px] font-semibold text-hive-primary">
                    {t('hive.photoCount', { count: photoCount })}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hive.close')}
                  className="h-9 w-9 items-center justify-center rounded-full bg-hive-surface2"
                  onPress={onClose}
                >
                  <X color={theme.textMuted} size={18} strokeWidth={2.25} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <GestureDetector gesture={contentPanGesture}>
            <View className="mt-[18px]">
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

              {stingsNewestFirst.length > 0 && (
                <GestureDetector gesture={listScrollGesture}>
                  <AnimatedScrollView
                    bounces
                    contentContainerStyle={{ gap: 18, paddingBottom: 8 }}
                    nestedScrollEnabled
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: listMaxHeight }}
                    onScroll={scrollHandler}
                  >
                    {hiveExpiresAt ? (
                      <View className="gap-2.5 rounded-2xl bg-hive-primary/15 p-3.5">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <Clock color={theme.accent} size={18} strokeWidth={2.25} />
                            <Text className="font-inter text-[13px] font-medium text-hive-muted">
                              {t('hive.dissolvesIn')}
                            </Text>
                          </View>
                          <Text className="font-display text-[15px] font-bold text-hive-primary">
                            {countdown.isExpired ? '0:00' : countdown.remainingLabel}
                          </Text>
                        </View>
                        <View className="h-[5px] overflow-hidden rounded-[3px] bg-white/10">
                          <View
                            className="h-full rounded-[3px] bg-hive-primary"
                            style={{ width: `${Math.round(dissolveProgress * 100)}%` }}
                          />
                        </View>
                      </View>
                    ) : null}

                    <HiveSheetBento stings={stingsNewestFirst} onPressSting={openSting} />

                    {contributors.length > 0 ? (
                      <View className="flex-row items-center gap-2.5">
                        <View className="flex-row gap-1.5">
                          {contributors.slice(0, 3).map((contributor, index) => {
                            const initials =
                              getProfileInitials(contributor.username).slice(0, 1) || '?';
                            const displayUri = contributor.avatarUrl
                              ? buildAvatarDisplayUri(contributor.avatarUrl, avatarCacheVersion)
                              : null;

                            return (
                              <Pressable
                                key={contributor.authorId}
                                accessibilityRole="button"
                                className="h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full"
                                style={{ backgroundColor: CONTRIBUTOR_COLORS[index] }}
                                onPress={() => openAuthorProfile(contributor.authorId)}
                              >
                                {displayUri ? (
                                  <Image
                                    accessibilityLabel={contributor.username}
                                    contentFit="cover"
                                    source={{ uri: displayUri }}
                                    style={{ width: 30, height: 30 }}
                                  />
                                ) : (
                                  <Text className="font-inter text-xs font-bold text-hive-on-accent">
                                    {initials}
                                  </Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                        <Text
                          className="flex-1 font-inter text-[13px] text-hive-muted"
                          numberOfLines={1}
                        >
                          {contributorLabel}
                        </Text>
                      </View>
                    ) : null}
                  </AnimatedScrollView>
                </GestureDetector>
              )}
            </View>
          </GestureDetector>

          {isInsideHive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('hive.addPhoto')}
              className="mt-[18px] h-[54px] flex-row items-center justify-center gap-2.5 rounded-full bg-hive-primary"
              onPress={openCamera}
            >
              <Camera color={theme.textOnAccent} size={20} strokeWidth={2.25} />
              <Text className="font-inter text-[15px] font-bold text-hive-on-accent">
                {t('hive.addPhoto')}
              </Text>
            </Pressable>
          ) : null}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
