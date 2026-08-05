import {
  CameraView as ExpoCameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

type HiveCameraViewProps = {
  cameraRef: RefObject<ExpoCameraView | null>;
  isActive: boolean;
  facing: CameraType;
  flash: FlashMode;
  zoom?: number;
  selectedLens?: string;
  onAvailableLensesChanged?: (event: { lenses: string[] }) => void;
  onCameraReady: () => void;
};

export function HiveCameraView({
  cameraRef,
  isActive,
  facing,
  flash,
  zoom = 0,
  selectedLens,
  onAvailableLensesChanged,
  onCameraReady,
}: HiveCameraViewProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-inter text-lg font-semibold text-white">
          {t('camera.permissionDeniedTitle')}
        </Text>
        <Text className="mt-2 text-center font-inter text-sm text-white/70">
          {t('camera.permissionDeniedMessage')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-hive-md bg-hive-primary px-6 py-3"
          onPress={() => {
            if (permission.canAskAgain) {
              void requestPermission();
              return;
            }
            void Linking.openSettings();
          }}
        >
          <Text className="font-inter text-base font-bold text-white">
            {permission.canAskAgain ? t('camera.requestPermission') : t('map.openSettings')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!isActive) {
    return <View className="flex-1 bg-black" />;
  }

  return (
    <ExpoCameraView
      ref={cameraRef}
      style={{ flex: 1 }}
      facing={facing}
      flash={flash}
      zoom={zoom}
      selectedLens={selectedLens}
      mirror={facing === 'front'}
      mode="picture"
      onAvailableLensesChanged={onAvailableLensesChanged}
      onCameraReady={onCameraReady}
    />
  );
}
