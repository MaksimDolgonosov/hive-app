import { useIsFocused } from '@react-navigation/native';
import type { CameraView } from 'expo-camera';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as partnerApi from '@/src/api/partner';
import { CaptureButton } from '@/src/components/camera/CaptureButton';
import { HiveCameraView } from '@/src/components/camera/CameraView';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useOnsiteCapture } from '@/src/hooks/useOnsiteCapture';
import { useAuthStore } from '@/src/stores/authStore';
import { trackEvent } from '@/src/utils/analytics-queue';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';

export default function PartnerOnsiteScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const params = useLocalSearchParams<{ applicationId?: string }>();
  const applicationId = typeof params.applicationId === 'string' ? params.applicationId : null;
  const { isReady, setIsReady, isCapturing, capture } = useOnsiteCapture(cameraRef);
  const [uploading, setUploading] = useState(false);

  async function handleCapture() {
    if (!applicationId || uploading || isCapturing) {
      return;
    }
    const shot = await capture();
    if (!shot.ok) {
      showMessageToast(
        shot.reason === 'location_denied' ? 'map.locationDeniedMessage' : 'camera.captureFailedMessage',
        'partner.onsiteTitle',
      );
      return;
    }

    setUploading(true);
    try {
      await partnerApi.uploadOnsite({
        applicationId,
        photoUri: shot.uri,
        lat: shot.lat,
        lng: shot.lng,
        accuracy: shot.accuracy,
        capturedAt: shot.capturedAt,
      });
      trackEvent('partner_onsite_succeeded');
      const submitted = await partnerApi.submitApplication(applicationId, {
        lat: shot.lat,
        lng: shot.lng,
      });
      trackEvent('partner_application_submitted');
      await refreshUser();
      router.replace(`/(modals)/partner/place/edit?placeId=${submitted.placeId}` as Href);
    } catch (error) {
      showApiErrorToast(error, { titleKey: 'partner.onsiteTitle' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <HiveCameraView
        cameraRef={cameraRef}
        facing="back"
        flash="off"
        isActive={isFocused && !uploading}
        onCameraReady={() => setIsReady(true)}
      />
      <View className="absolute left-0 right-0 px-6" style={{ top: insets.top + 16 }}>
        <Text className="text-center font-display text-xl font-bold text-white">{t('partner.onsiteTitle')}</Text>
        <Text className="mt-2 text-center font-inter text-sm leading-5 text-white/80">{t('partner.onsiteBody')}</Text>
      </View>
      <View className="absolute bottom-0 left-0 right-0 items-center" style={{ paddingBottom: insets.bottom + 28 }}>
        <Text className="mb-4 px-8 text-center font-inter text-xs text-white/70">{t('partner.onsiteNotFeed')}</Text>
        {uploading || !isReady ? (
          <HiveLoader size={72} />
        ) : (
          <CaptureButton disabled={isCapturing} onPress={() => void handleCapture()} />
        )}
      </View>
    </View>
  );
}
