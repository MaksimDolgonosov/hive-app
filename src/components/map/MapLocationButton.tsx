import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, StyleSheet } from 'react-native';

const LOCATE_ICON = require('../../../assets/icons/bee100.png');

const BUTTON_SIZE = 52;
const ICON_SIZE = 34;

type MapLocationButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function MapLocationButton({ onPress, disabled = false }: MapLocationButtonProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('map.centerOnUser')}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Image resizeMode="contain" source={LOCATE_ICON} style={styles.icon} />
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
    borderColor: 'rgba(245, 166, 35, 0.35)',
    ...(Platform.OS === 'android'
      ? {
          elevation: 16,
        }
      : {
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
