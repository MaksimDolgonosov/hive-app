import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { Timer } from '@/src/components/ui/Timer';
import { useStingDetail } from '@/src/hooks/useStingDetail';
import { useStingReaction } from '@/src/hooks/useStingReaction';
import { useAuthStore } from '@/src/stores/authStore';
import type { Sting } from '@/src/types';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { openUserProfile } from '@/src/utils/open-user-profile';
import { resolveStingAuthor } from '@/src/utils/resolve-sting-author';
import { showApiErrorToast } from '@/src/utils/show-toast';

const AUTHOR_AVATAR_SIZE = 40;
const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 900;

export default function StingDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);

  const stingId = typeof id === 'string' ? id : null;
  const { data, isLoading, isError } = useStingDetail(stingId);
  const reactToSting = useStingReaction(stingId ?? '');

  const sting = data?.sting;
  const isLiked = sting?.hasLiked ?? false;
  const author = sting ? resolveStingAuthor(sting, currentUser) : null;
  const authorAvatarUri = author?.avatarUrl
    ? buildAvatarDisplayUri(author.avatarUrl, avatarCacheVersion)
    : null;
  const authorInitials = author ? getProfileInitials(author.username) || '?' : '?';

  function handleOpenAuthorProfile() {
    if (!sting) {
      return;
    }

    openUserProfile(sting.authorId, currentUser?.id);
  }

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.dismissAll();
  }, []);

  const translateY = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(12)
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          translateY.value = Math.max(0, event.translationY);
        })
        .onEnd((event) => {
          const shouldDismiss =
            event.translationY > DISMISS_THRESHOLD || event.velocityY > DISMISS_VELOCITY;

          if (shouldDismiss) {
            translateY.value = withTiming(700, { duration: 220 }, (finished) => {
              if (finished) {
                runOnJS(handleClose)();
              }
            });
            return;
          }

          translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
        }),
    [handleClose, translateY],
  );

  const animatedContainerStyle = useAnimatedStyle(() => {
    const progress = Math.min(translateY.value / 320, 1);

    return {
      transform: [{ translateY: translateY.value }, { scale: 1 - progress * 0.04 }],
      opacity: 1 - progress * 0.35,
    };
  });

  async function handleReact() {
    if (!stingId || reactToSting.isPending) {
      return;
    }

    try {
      await reactToSting.mutateAsync();
    } catch (error) {
      showApiErrorToast(error, {
        titleKey: 'sting.reactFailedTitle',
        fallbackKey: 'sting.reactFailedMessage',
      });
    }
  }

  if (!stingId) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="font-inter text-base text-white">{t('sting.notFound')}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    );
  }

  if (isError || !sting) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-inter text-base text-white">{t('sting.notFound')}</Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-hive-md bg-hive-primary px-6 py-3"
          onPress={handleClose}
        >
          <Text className="font-inter text-base font-bold text-white">{t('sting.close')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View className="flex-1 bg-black" style={animatedContainerStyle}>
        <StingDetailBody
          author={author}
          authorAvatarUri={authorAvatarUri}
          authorInitials={authorInitials}
          insets={insets}
          isLiked={isLiked}
          reactToSting={reactToSting}
          sting={sting}
          t={t}
          onClose={handleClose}
          onOpenAuthorProfile={handleOpenAuthorProfile}
          onReact={() => void handleReact()}
        />
      </Animated.View>
    </GestureDetector>
  );
}

type StingDetailBodyProps = {
  sting: Sting;
  author: ReturnType<typeof resolveStingAuthor> | null;
  authorAvatarUri: string | null;
  authorInitials: string;
  insets: { top: number; bottom: number };
  isLiked: boolean;
  reactToSting: { isPending: boolean };
  t: ReturnType<typeof useTranslation>['t'];
  onClose: () => void;
  onOpenAuthorProfile: () => void;
  onReact: () => void;
};

function StingDetailBody({
  sting,
  author,
  authorAvatarUri,
  authorInitials,
  insets,
  isLiked,
  reactToSting,
  t,
  onClose,
  onOpenAuthorProfile,
  onReact,
}: StingDetailBodyProps) {
  return (
    <>
      <Image
        accessibilityLabel={t('sting.photoAlt')}
        contentFit="contain"
        source={{ uri: sting.imageUrl }}
        style={{ flex: 1 }}
      />

      <View className="absolute left-4" style={{ top: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sting.close')}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          onPress={onClose}
        >
          <X color="#FFFFFF" size={22} />
        </Pressable>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 gap-3 bg-black/60 px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {sting.comment ? (
          <Text className="font-inter text-sm text-white/90">{sting.comment}</Text>
        ) : null}

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-inter text-xs text-white/70">{t('sting.expiresIn')}</Text>
            <Timer
              expiresAt={sting.expiresAt}
              className="font-inter text-lg font-semibold text-white"
            />
          </View>

          <View className="flex-row items-center gap-2">
            {author ? (
              <Pressable
                accessibilityLabel={t('sting.viewAuthorProfile', { username: author.username })}
                accessibilityRole="button"
                className="flex-row items-center gap-2 py-1 pl-1 pr-3"
                onPress={onOpenAuthorProfile}
              >
                {authorAvatarUri ? (
                  <Image
                    accessibilityLabel={author.username}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={{ uri: authorAvatarUri }}
                    style={{
                      width: AUTHOR_AVATAR_SIZE,
                      height: AUTHOR_AVATAR_SIZE,
                      borderRadius: AUTHOR_AVATAR_SIZE / 2,
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={['#F5A623', '#FF8C00']}
                    end={{ x: 1, y: 1 }}
                    start={{ x: 0, y: 0 }}
                    style={{
                      width: AUTHOR_AVATAR_SIZE,
                      height: AUTHOR_AVATAR_SIZE,
                      borderRadius: AUTHOR_AVATAR_SIZE / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="font-inter text-[10px] font-bold text-white">
                      {authorInitials}
                    </Text>
                  </LinearGradient>
                )}

                <Text
                  className="max-w-[88px] font-inter text-sm font-semibold text-white"
                  numberOfLines={1}
                >
                  {author.username}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLiked ? t('sting.unlike') : t('sting.like')}
              accessibilityState={{ selected: isLiked }}
              className={`flex-row items-center gap-2 rounded-full px-5 py-3 ${
                isLiked ? 'bg-hive-primary' : 'border border-white/30 bg-black/40'
              }`}
              disabled={reactToSting.isPending}
              onPress={onReact}
            >
              {reactToSting.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Heart color="#FFFFFF" fill={isLiked ? '#FFFFFF' : 'transparent'} size={20} />
              )}
              <Text className="font-inter text-base font-semibold text-white">
                {sting.reactionsCount}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
