import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/src/components/ui/GlassSurface';

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
      <View style={styles.shadow}>
        <GlassSurface
          containerStyle={styles.content}
          cornerRadius={BUTTON_SIZE / 2}
          interactive
          style={styles.surface}
        >
          <Image resizeMode="contain" source={LOCATE_ICON} style={styles.icon} />
        </GlassSurface>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    marginBottom: 15,
    borderRadius: BUTTON_SIZE / 2,
    ...(Platform.OS === 'android'
      ? { elevation: 16 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
        }),
  },
  surface: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
