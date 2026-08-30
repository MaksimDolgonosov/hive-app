import { Bookmark, MapPin, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { useMapStore } from '@/src/stores/mapStore';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';
import type { SavedMapPlace } from '@/src/types';

function formatCoordinate(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 4,
  }).format(value);
}

export default function SavedPlacesScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const places = useSavedMapPlacesStore((state) => state.places);
  const removePlace = useSavedMapPlacesStore((state) => state.removePlace);
  const requestSavedRegionFocus = useMapStore((state) => state.requestSavedRegionFocus);

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  function openSavedPlace(place: SavedMapPlace) {
    requestSavedRegionFocus(place.region);

    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace('/(tabs)/' as Href);
  }

  function confirmDelete(place: SavedMapPlace) {
    Alert.alert(t('map.savedPlacesDeleteTitle'), t('map.savedPlacesDeleteMessage', { name: place.name }), [
      { text: t('map.savePlaceCancel'), style: 'cancel' },
      {
        text: t('map.savedPlacesDeleteConfirm'),
        style: 'destructive',
        onPress: () => void removePlace(place.id),
      },
    ]);
  }

  const listBottomInset = insets.bottom + 24;

  return (
    <ProfileCollectionLayout title={t('profile.menuSavedPlaces')} onBack={handleBack}>
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: listBottomInset,
          flexGrow: places.length === 0 ? 1 : undefined,
          gap: 10,
        }}
        data={places}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-hive-primary/15">
              <Bookmark color="#F5A623" size={28} strokeWidth={2} />
            </View>
            <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
              {t('profile.collections.savedPlacesEmptyTitle')}
            </Text>
            <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
              {t('profile.collections.savedPlacesEmptyMessage')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="overflow-hidden rounded-hive-md border border-[#F5A62322] bg-hive-surface/95">
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-3 px-4 py-3.5"
              onPress={() => openSavedPlace(item)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-hive-primary/15">
                <MapPin color="#F5A623" size={18} strokeWidth={2.25} />
              </View>

              <View className="min-w-0 flex-1">
                <Text className="font-inter text-base font-semibold text-hive-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="mt-0.5 font-inter text-xs text-hive-muted">
                  {t('map.savedPlacesCoords', {
                    lat: formatCoordinate(item.region.latitude, locale),
                    lng: formatCoordinate(item.region.longitude, locale),
                  })}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-[#FFF4E0]"
              onPress={() => confirmDelete(item)}
            >
              <Trash2 color="#8B7355" size={16} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      />
    </ProfileCollectionLayout>
  );
}
