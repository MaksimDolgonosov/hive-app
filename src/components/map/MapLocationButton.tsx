import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

// bee100.png — с непрозрачным чёрным фоном, перекрывает стили кнопки; bee.png — с альфой.
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
      style={({ pressed }) => [disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <View style={styles.button}>
        <Image resizeMode="contain" source={LOCATE_ICON} style={styles.icon} />
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
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.17)',
    overflow: 'hidden',
    marginBottom: 15,
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
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
