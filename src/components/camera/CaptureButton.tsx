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
      <View className="h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-black/40">
        {loading ? (
          <HiveLoader color="#FFFFFF" size="small" />
        ) : (
          <View
            className={`h-16 w-16 rounded-full bg-hive-primary  ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
          />
        )}
      </View>
    </Pressable>
  );
}
