import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GlassSurface } from '@/src/components/ui/GlassSurface';
import type { MapFilter } from '@/src/types';

const FILTERS: MapFilter[] = ['all', 'fresh', 'hives', 'expiring'];

type MapFilterChipsProps = {
  value: MapFilter;
  onChange: (filter: MapFilter) => void;
};

export function MapFilterChips({ value, onChange }: MapFilterChipsProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      pointerEvents="auto"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    >
      {FILTERS.map((filter) => {
        const selected = value === filter;
        const label =
          filter === 'all'
            ? t('map.filter.all')
            : filter === 'fresh'
              ? t('map.filter.fresh')
              : filter === 'hives'
                ? t('map.filter.hives')
                : t('map.filter.expiring');

        return (
          <Pressable
            key={filter}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(filter)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {selected ? (
              <View className="h-8 items-center justify-center rounded-full bg-hive-primary px-3">
                <Text className="font-inter text-xs font-semibold text-hive-on-accent">
                  {label}
                </Text>
              </View>
            ) : (
              <View style={styles.shadow}>
                <GlassSurface
                  containerStyle={styles.chipContent}
                  cornerRadius={16}
                  interactive
                  style={styles.chip}
                >
                  <Text className="font-inter text-xs font-semibold text-hive-foreground">
                    {label}
                  </Text>
                </GlassSurface>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    ...(Platform.OS === 'android'
      ? { elevation: 8 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
        }),
  },
  chip: {
    height: 32,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  chipContent: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
