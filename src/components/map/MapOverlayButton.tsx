import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { HiveTheme } from '@/src/theme/tokens';

const BUTTON_SIZE = 48;
const ICON_SIZE = 20;

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
        <Icon color={HiveTheme.accent} size={ICON_SIZE} strokeWidth={2.25} />
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
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    ...(Platform.OS === 'android'
      ? {
          elevation: 16,
        }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius: 8,
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
