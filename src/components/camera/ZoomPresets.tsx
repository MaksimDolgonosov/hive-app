import type { CameraType } from 'expo-camera';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatZoomPresetLabel,
  isPresetAvailable,
  ZOOM_PRESETS,
  type ZoomPreset,
} from '@/src/utils/camera-zoom';

type ZoomPresetsProps = {
  activePreset: ZoomPreset;
  availableLenses: string[];
  facing: CameraType;
  onSelect: (preset: ZoomPreset) => void;
};

export function ZoomPresets({
  activePreset,
  availableLenses,
  facing,
  onSelect,
}: ZoomPresetsProps) {
  return (
    <View style={styles.row}>
      {ZOOM_PRESETS.map((preset) => {
        const isActive = activePreset === preset;
        const isAvailable = isPresetAvailable(preset, facing, availableLenses);

        return (
          <Pressable
            key={preset}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: !isAvailable }}
            disabled={!isAvailable}
            onPress={() => onSelect(preset)}
            style={[
              styles.chip,
              isActive && styles.chipActive,
              !isAvailable && styles.chipDisabled,
            ]}
          >
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                !isAvailable && styles.labelDisabled,
              ]}
            >
              {formatZoomPresetLabel(preset)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipActive: {
    backgroundColor: '#F5A623',
  },
  chipDisabled: {
    opacity: 0.35,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
