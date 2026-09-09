import { Pressable, View } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';

type CaptureButtonProps = {
  onPress: () => void;
  onPressIn?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function CaptureButton({
  onPress,
  onPressIn,
  disabled = false,
  loading = false,
}: CaptureButtonProps) {
  const isDisabled = disabled || loading;

  function handlePressIn() {
    if (isDisabled) {
      return;
    }
    onPressIn?.();
  }

  function handlePress() {
    if (isDisabled) {
      return;
    }
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Capture photo"
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPress={() => void handlePress()}
      className="items-center justify-center"
    >
      <View className="h-[76px] w-[76px] items-center justify-center rounded-full bg-hive-primary shadow-lg">
        {loading ? (
          <HiveLoader color="#0B0A08" size="small" />
        ) : (
          <View
            className={`h-16 w-16 rounded-full ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
            style={{ backgroundColor: '#FFFFFF' }}
          />
        )}
      </View>
    </Pressable>
  );
}
