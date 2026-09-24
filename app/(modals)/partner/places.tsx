import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import * as placesApi from '@/src/api/places';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';

const PLACE_MAX = 3;

export default function MyPlacesScreen() {
  const { t } = useTranslation();
  const placesQuery = useQuery({
    queryKey: ['places', 'me'],
    queryFn: placesApi.listMyPlaces,
  });
  const places = placesQuery.data ?? [];
  const publishedCount = places.filter((place) => place.status !== 'draft').length;
  const canAdd = publishedCount < PLACE_MAX;

  return (
    <ScreenBackground>
      <ModalHeader backLabel={t('hive.back')} title={t('partner.menuApply')} />
      <ScrollView contentContainerStyle={{ gap: 12, padding: 20 }}>
        {places.map((place) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            className="rounded-2xl bg-hive-surface px-4 py-4"
            onPress={() => router.push(`/(modals)/partner/place/edit?placeId=${place.id}` as Href)}
          >
            <Text className="font-display text-lg font-bold text-hive-foreground">{place.name}</Text>
            <Text className="mt-1 font-inter text-sm text-hive-muted">
              {t(`partner.status.${place.status}`)}
            </Text>
          </Pressable>
        ))}
        {places.length === 0 ? (
          <Text className="font-inter text-sm text-hive-muted">{t('partner.emptyPlaces')}</Text>
        ) : null}
        {canAdd ? (
          <Pressable
            accessibilityRole="button"
            className="mt-2 h-[52px] items-center justify-center rounded-full bg-hive-primary"
            onPress={() => router.push('/(modals)/partner/apply' as Href)}
          >
            <Text className="font-inter text-[15px] font-bold text-hive-on-accent">{t('partner.addPlace')}</Text>
          </Pressable>
        ) : null}
        {publishedCount >= PLACE_MAX ? (
          <Text className="font-inter text-xs text-hive-muted">{t('partner.limitReached')}</Text>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}
