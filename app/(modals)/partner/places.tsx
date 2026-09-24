import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ChevronRight, Store, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import * as placesApi from '@/src/api/places';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { showInfoToast } from '@/src/stores/toastStore';
import type { Place, PlaceStatus } from '@/src/types';
import { showApiErrorToast } from '@/src/utils/show-toast';
import { removePlaceFromNearbyQueries } from '@/src/utils/stings-query-cache';

const PLACE_MAX = 3;

function statusClass(status: PlaceStatus): string {
  if (status === 'live') {
    return 'text-hive-primary';
  }
  if (status === 'suspended') {
    return 'text-hive-danger';
  }
  return 'text-hive-muted';
}

function PlaceListCard({
  place,
  removing,
  onPress,
  onRemove,
}: {
  place: Place;
  removing: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const coverUrl = place.cover?.thumbnailUrl ?? null;
  const canRemove = place.status === 'live' || place.status === 'draft';

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 overflow-hidden rounded-hive-md border px-4 py-3.5"
      style={{ backgroundColor: theme.surface, borderColor: theme.stroke }}
      onPress={onPress}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.surface2 }}
        />
      ) : (
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: theme.accentSoft }}
        >
          <Store color={theme.accent} size={18} strokeWidth={2.25} />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <Text className="font-inter text-base font-semibold" numberOfLines={1} style={{ color: theme.text }}>
          {place.name}
        </Text>
        <Text className={`mt-0.5 font-inter text-xs ${statusClass(place.status)}`}>
          {t(`partner.status.${place.status}`)}
        </Text>
      </View>

      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={place.status === 'draft' ? t('partner.deleteDraft') : t('partner.pause')}
          disabled={removing}
          hitSlop={8}
          onPress={onRemove}
        >
          <Trash2 color={theme.danger} size={18} strokeWidth={2} />
        </Pressable>
      ) : null}
      <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />
    </Pressable>
  );
}

export default function MyPlacesScreen() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const queryClient = useQueryClient();
  const placesQuery = useQuery({
    queryKey: ['places', 'me'],
    queryFn: placesApi.listMyPlaces,
  });
  const remove = useMutation({
    mutationFn: async (place: Place) => {
      if (place.status === 'draft') {
        await placesApi.deletePlace(place.id);
        return { kind: 'draft' as const, id: place.id };
      }
      const next = await placesApi.pausePlace(place.id);
      return { kind: 'paused' as const, place: next };
    },
    onSuccess: (result) => {
      if (result.kind === 'draft') {
        queryClient.setQueryData<Place[]>(['places', 'me'], (current) =>
          current?.filter((item) => item.id !== result.id),
        );
        showInfoToast({ message: t('partner.draftDeleted') });
        return;
      }

      queryClient.setQueryData<Place[]>(['places', 'me'], (current) =>
        current?.map((item) => (item.id === result.place.id ? result.place : item)),
      );
      queryClient.setQueryData(['place', result.place.id], { place: result.place, viewerIsOwner: true });
      removePlaceFromNearbyQueries(queryClient, result.place.id);
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      showInfoToast({ message: t('partner.removedFromMap') });
    },
    onError: (error) => showApiErrorToast(error, { titleKey: 'partner.placesTitle' }),
  });
  const places = placesQuery.data ?? [];
  const publishedCount = places.filter((place) => place.status !== 'draft').length;
  const canAdd = publishedCount < PLACE_MAX;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  function confirmRemove(place: Place) {
    const draft = place.status === 'draft';
    Alert.alert(
      t(draft ? 'partner.deleteDraftTitle' : 'partner.removeFromMapTitle'),
      t(draft ? 'partner.deleteDraftMessage' : 'partner.removeFromMapMessage'),
      [
        { text: t('sting.deleteCancel'), style: 'cancel' },
        {
          text: t(draft ? 'partner.deleteDraft' : 'partner.pause'),
          style: 'destructive',
          onPress: () => remove.mutate(place),
        },
      ],
    );
  }

  return (
    <ProfileCollectionLayout title={t('partner.menuApply')} onBack={handleBack}>
      {placesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <HiveLoader size={88} strokeWidth={3} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 32,
            flexGrow: places.length === 0 ? 1 : undefined,
          }}
          showsVerticalScrollIndicator={false}
        >
          {places.map((place) => (
            <PlaceListCard
              key={place.id}
              place={place}
              removing={remove.isPending && remove.variables?.id === place.id}
              onPress={() => router.push(`/(modals)/partner/place/edit?placeId=${place.id}` as Href)}
              onRemove={() => confirmRemove(place)}
            />
          ))}
          {places.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8 py-16">
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accentSoft }}
              >
                <Store color={theme.accent} size={28} strokeWidth={2} />
              </View>
              <Text className="text-center font-inter text-base font-semibold text-hive-foreground">
                {t('partner.emptyPlaces')}
              </Text>
            </View>
          ) : null}
          {canAdd ? (
            <Pressable
              accessibilityRole="button"
              className="mt-2 h-[52px] items-center justify-center rounded-full bg-hive-primary"
              onPress={() => router.push('/(modals)/partner/apply' as Href)}
            >
              <Text className="font-inter text-[15px] font-bold text-hive-on-accent">
                {t('partner.addPlace')}
              </Text>
            </Pressable>
          ) : null}
          {publishedCount >= PLACE_MAX ? (
            <Text className="text-center font-inter text-xs text-hive-muted">{t('partner.limitReached')}</Text>
          ) : null}
        </ScrollView>
      )}
    </ProfileCollectionLayout>
  );
}
