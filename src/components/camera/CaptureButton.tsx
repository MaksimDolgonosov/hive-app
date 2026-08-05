import { ActivityIndicator, Pressable, View } from 'react-native';

import { impactCapture } from '@/src/utils/haptics';

type CaptureButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function CaptureButton({ onPress, disabled = false, loading = false }: CaptureButtonProps) {
  const isDisabled = disabled || loading;

  async function handlePress() {
    if (isDisabled) {
      return;
    }
    await impactCapture();
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Capture photo"
      disabled={isDisabled}
      onPress={() => void handlePress()}
      className="items-center justify-center"
    >
      <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/90">
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View
            className={`h-16 w-16 rounded-full bg-white ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
          />
        )}
      </View>
    </Pressable>
  );
}
