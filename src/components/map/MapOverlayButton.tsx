import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

const BUTTON_SIZE = 52;
const ICON_SIZE = 22;

type MapOverlayButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

export function MapOverlayButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  disabled = false,
}: MapOverlayButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <View style={styles.button}>
        <Icon color="#F5A623" size={ICON_SIZE} strokeWidth={2.25} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: 'rgba(253, 162, 14, 0.35)',
    overflow: 'hidden',
    ...(Platform.OS === 'android'
      ? {
          elevation: 16,
        }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
        }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
