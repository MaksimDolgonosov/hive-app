import type { CameraType, FlashMode } from 'expo-camera';
import { SwitchCamera, Zap, ZapOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type CameraControlsProps = {
  facing: CameraType;
  flash: FlashMode;
  onToggleFacing: () => void;
  onToggleFlash: () => void;
};

export function CameraControls({
  facing,
  flash,
  onToggleFacing,
  onToggleFlash,
}: CameraControlsProps) {
  const { t } = useTranslation();
  const showFlash = facing === 'back';

  return (
    <View className="flex-row items-center gap-3">
      {showFlash && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('camera.toggleFlash')}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          onPress={onToggleFlash}
        >
          {flash === 'off' ? (
            <ZapOff color="#FFFFFF" size={20} />
          ) : (
            <Zap
              color={flash === 'on' ? '#F5A623' : '#FFFFFF'}
              fill={flash === 'on' ? '#F5A623' : 'none'}
              size={20}
            />
          )}
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('camera.flipCamera')}
        className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
        onPress={onToggleFacing}
      >
        <SwitchCamera color="#FFFFFF" size={20} />
      </Pressable>
    </View>
  );
}

function cycleFlash(current: FlashMode): FlashMode {
  if (current === 'off') {
    return 'auto';
  }
  if (current === 'auto') {
    return 'on';
  }
  return 'off';
}

export { cycleFlash };
