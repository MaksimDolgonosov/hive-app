import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Timer } from '@/src/components/ui/Timer';
import { useStingDetail } from '@/src/hooks/useStingDetail';
import { useStingReaction } from '@/src/hooks/useStingReaction';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function StingDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const stingId = typeof id === 'string' ? id : null;
  const { data, isLoading, isError } = useStingDetail(stingId);
  const reactToSting = useStingReaction(stingId ?? '');

  const sting = data?.sting;

  function handleClose() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.dismissAll();
  }

  async function handleReact() {
    if (!stingId || reactToSting.isPending) {
      return;
    }

    try {
      await reactToSting.mutateAsync();
    } catch (error) {
      Alert.alert(t('sting.reactFailedTitle'), getApiErrorMessage(error, 'sting.reactFailedMessage'));
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
    <View className="flex-1 bg-black">
      <Image
        accessibilityLabel={t('sting.photoAlt')}
        contentFit="contain"
        source={{ uri: sting.imageUrl }}
        style={{ flex: 1 }}
      />

      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sting.close')}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          onPress={handleClose}
        >
          <X color="#FFFFFF" size={22} />
        </Pressable>

        <View className="rounded-full bg-black/50 px-4 py-2">
          <Timer
            expiresAt={sting.expiresAt}
            className="font-inter text-sm font-semibold text-white"
          />
        </View>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between bg-black/60 px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View>
          <Text className="font-inter text-xs text-white/70">{t('sting.expiresIn')}</Text>
          <Timer
            expiresAt={sting.expiresAt}
            className="font-inter text-lg font-semibold text-white"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sting.like')}
          className="flex-row items-center gap-2 rounded-full bg-hive-primary px-5 py-3"
          disabled={reactToSting.isPending}
          onPress={() => void handleReact()}
        >
          {reactToSting.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Heart color="#FFFFFF" fill="#FFFFFF" size={20} />
          )}
          <Text className="font-inter text-base font-semibold text-white">
            {sting.reactionsCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
