import { ActivityIndicator, Pressable, View } from 'react-native';

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
