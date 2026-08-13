import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

const LOCATE_ICON = require('../../../assets/icons/bee100.png');

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
      <View style={styles.iconCircle}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={LOCATE_ICON}
          style={styles.icon}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 57,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28.5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.45,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.35)',
    marginBottom: 10,
  },
  icon: {
    width: 45,
    height: 45,
  },
});
