import type { CameraView, CameraType, FlashMode } from 'expo-camera';
import { router, type Href } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraControls, cycleFlash } from '@/src/components/camera/CameraControls';
import { CaptureButton } from '@/src/components/camera/CaptureButton';
import { HiveCameraView } from '@/src/components/camera/CameraView';
import { ZoomPresets } from '@/src/components/camera/ZoomPresets';
import { useCamera } from '@/src/hooks/useCamera';
import { useCameraZoom } from '@/src/hooks/useCameraZoom';
import { useCameraStore } from '@/src/stores/cameraStore';

export default function CameraScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');

  const beginPublishFlow = useCameraStore((state) => state.beginPublishFlow);
  const clearCapture = useCameraStore((state) => state.clearCapture);

  const { isReady, setIsReady, isCapturing, capture } = useCamera(cameraRef);
  const {
    zoom,
    activePreset,
    selectedLens,
    availableLenses,
    setPreset,
    pinchGesture,
    onCameraReady,
    onAvailableLensesChanged,
  } = useCameraZoom(cameraRef, facing);

  useEffect(() => {
    beginPublishFlow();
  }, [beginPublishFlow]);

  async function handleCameraReady() {
    setIsReady(true);
    await onCameraReady();
  }

  function handleClose() {
    clearCapture();
    router.back();
  }

  function handleToggleFacing() {
    setFacing((current) => {
      const next = current === 'back' ? 'front' : 'back';
      if (next === 'front') {
        setFlash('off');
      }
      return next;
    });
  }

  function handleToggleFlash() {
    setFlash((current) => cycleFlash(current));
  }

  async function handleCapture() {
    const result = await capture();
    if (result.ok) {
      router.push('/(modals)/preview' as Href);
      return;
    }

    Alert.alert(
      t('camera.captureFailedTitle'),
      result.reason === 'location_denied'
        ? t('map.locationDeniedMessage')
        : result.reason === 'location_unavailable'
          ? t('camera.locationUnavailableMessage')
          : t('camera.captureFailedMessage'),
    );
  }

  return (
    <View className="flex-1 bg-black">
      <GestureDetector gesture={pinchGesture}>
        <View className="flex-1">
          <HiveCameraView
            cameraRef={cameraRef}
            isActive={isFocused}
            facing={facing}
            flash={flash}
            zoom={zoom}
            selectedLens={selectedLens}
            onAvailableLensesChanged={onAvailableLensesChanged}
            onCameraReady={() => void handleCameraReady()}
          />
        </View>
      </GestureDetector>

      <View
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('camera.close')}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          onPress={handleClose}
        >
          <X color="#FFFFFF" size={22} />
        </Pressable>
        <Text className="font-inter text-sm font-semibold text-white">{t('camera.title')}</Text>
        <CameraControls
          facing={facing}
          flash={flash}
          onToggleFacing={handleToggleFacing}
          onToggleFlash={handleToggleFlash}
        />
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 items-center pb-8"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <ZoomPresets
          activePreset={activePreset}
          availableLenses={availableLenses}
          facing={facing}
          onSelect={setPreset}
        />
        <CaptureButton
          disabled={!isReady}
          loading={isCapturing}
          onPress={() => void handleCapture()}
        />
      </View>
    </View>
  );
}
