import { ScrollView, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

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
            className={`h-8 items-center justify-center rounded-full px-3 ${
              selected ? 'bg-hive-primary' : 'border border-hive-stroke bg-hive-surface/95'
            }`}
            onPress={() => onChange(filter)}
          >
            <Text
              className={`font-inter text-xs font-semibold ${
                selected ? 'text-hive-on-accent' : 'text-hive-foreground'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
