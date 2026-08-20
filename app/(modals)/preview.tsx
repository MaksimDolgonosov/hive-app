import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { STING_COMMENT_MAX_LENGTH } from '@/src/api/stings';
import { usePublishSting } from '@/src/hooks/usePublishSting';
import { useCameraStore } from '@/src/stores/cameraStore';
import { logApiError } from '@/src/utils/api-error';
import { showApiErrorToast } from '@/src/utils/show-toast';
import { normalizeAccuracy } from '@/src/utils/exif';
import { notifyPublishError, notifyPublishSuccess } from '@/src/utils/haptics';

const LOW_ACCURACY_THRESHOLD_M = 50;
const STALE_CAPTURE_THRESHOLD_MS = 90_000;

export default function PreviewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const publishSting = usePublishSting();
  const [comment, setComment] = useState('');

  const capturedUri = useCameraStore((state) => state.capturedUri);
  const captureCoords = useCameraStore((state) => state.captureCoords);
  const captureAccuracy = useCameraStore((state) => state.captureAccuracy);
  const capturedAt = useCameraStore((state) => state.capturedAt);
  const idempotencyKey = useCameraStore((state) => state.idempotencyKey);
  const isCameraCapture = useCameraStore((state) => state.isCameraCapture);
  const clearPhoto = useCameraStore((state) => state.clearPhoto);
  const clearCapture = useCameraStore((state) => state.clearCapture);

  const isLowAccuracy = captureAccuracy !== null && captureAccuracy > LOW_ACCURACY_THRESHOLD_M;

  useEffect(() => {
    if (!capturedUri || !captureCoords || !capturedAt || !idempotencyKey || !isCameraCapture) {
      router.replace('/(modals)/camera' as Href);
    }
  }, [captureCoords, capturedAt, capturedUri, idempotencyKey, isCameraCapture]);

  if (!capturedUri || !captureCoords || !capturedAt || !idempotencyKey || !isCameraCapture) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    );
  }

  const isStaleCapture = Date.now() - new Date(capturedAt).getTime() > STALE_CAPTURE_THRESHOLD_MS;

  const photoUri = capturedUri;
  const coords = captureCoords;
  const photoCapturedAt = capturedAt;
  const publishKey = idempotencyKey;

  function dismissKeyboard() {
    Keyboard.dismiss();
  }

  function handleRetake() {
    dismissKeyboard();
    clearPhoto();
    router.back();
  }

  function handleCancel() {
    dismissKeyboard();
    clearCapture();
    router.dismissAll();
  }

  async function handlePublish() {
    if (publishSting.isPending) {
      return;
    }

    dismissKeyboard();

    try {
      await publishSting.mutateAsync({
        photoUri,
        lat: coords.lat,
        lng: coords.lng,
        accuracy: normalizeAccuracy(captureAccuracy),
        capturedAt: photoCapturedAt,
        idempotencyKey: publishKey,
        comment: comment.trim() || undefined,
      });

      void notifyPublishSuccess();
      clearCapture();
      router.dismissAll();
      router.replace('/(tabs)/' as Href);
    } catch (error) {
      logApiError('preview.publish', error);
      await notifyPublishError();
      showApiErrorToast(error, {
        titleKey: 'camera.publishFailedTitle',
        fallbackKey: 'camera.publishFailedMessage',
      });
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
      keyboardVerticalOffset={0}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('camera.previewAlt')}
        className="flex-1"
        onPress={dismissKeyboard}
      >
        <Image
          accessibilityLabel={t('camera.previewAlt')}
          contentFit="contain"
          source={{ uri: photoUri }}
          style={{ flex: 1 }}
        />

        {(isLowAccuracy || isStaleCapture) && (
          <View
            className="absolute left-4 right-4 rounded-hive-md bg-amber-500/90 px-4 py-3"
            style={{ top: insets.top + 12 }}
            pointerEvents="none"
          >
            <Text className="text-center font-inter text-sm font-semibold text-white">
              {isStaleCapture ? t('camera.staleCaptureWarning') : t('camera.lowAccuracyWarning')}
            </Text>
          </View>
        )}
      </Pressable>

      <View className="gap-3 bg-black/70 px-6 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="gap-1.5">
          <TextInput
            accessibilityLabel={t('camera.commentLabel')}
            className="max-h-[120px] min-h-[72px] rounded-hive-md border border-white/20 bg-black/40 px-3.5 py-2.5 font-inter text-[15px] text-white"
            maxLength={STING_COMMENT_MAX_LENGTH}
            multiline
            placeholder={t('camera.commentPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.45)"
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
          <Text className="text-right font-inter text-xs text-white/50">
            {t('camera.commentCounter', {
              count: comment.length,
              max: STING_COMMENT_MAX_LENGTH,
            })}
          </Text>
        </View>

        <AuthButton
          loading={publishSting.isPending}
          title={t('camera.publish')}
          onPress={() => void handlePublish()}
        />

        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            className="flex-1 items-center rounded-hive-md border border-white/30 py-3"
            disabled={publishSting.isPending}
            onPress={handleRetake}
          >
            <Text className="font-inter text-base font-semibold text-white">
              {t('camera.retake')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="flex-1 items-center rounded-hive-md border border-white/30 py-3"
            disabled={publishSting.isPending}
            onPress={handleCancel}
          >
            <Text className="font-inter text-base font-semibold text-white">
              {t('camera.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
