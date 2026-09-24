import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import * as placesApi from '@/src/api/places';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import type { PlaceMediaSource } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';
import { PlaceLibraryPermissionError, pickPlaceImages } from '@/src/utils/pick-place-image';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';

const GALLERY_MAX = 12;

export default function PlaceMediaScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const placeId = typeof params.placeId === 'string' ? params.placeId : null;
  const placeQuery = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => placesApi.getPlace(placeId!),
    enabled: placeId !== null,
  });
  const [busy, setBusy] = useState(false);
  const place = placeQuery.data?.place;
  const readOnly = place?.status === 'suspended';

  const refresh = useMutation({
    mutationFn: async (input: { uris: string[]; kind: 'cover' | 'gallery'; source: PlaceMediaSource }) => {
      let wentLive = false;
      let latest = place!;
      for (const uri of input.uris) {
        const result = await placesApi.uploadPlaceMedia({
          placeId: placeId!,
          photoUri: uri,
          kind: input.kind,
          source: input.source,
        });
        latest = result.place;
        wentLive = wentLive || result.wentLive;
        trackEvent(input.kind === 'cover' ? 'place_cover_uploaded' : 'place_gallery_uploaded', {
          props: { source: input.source },
        });
      }
      if (wentLive) {
        trackEvent('place_went_live');
      }
      return latest;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['place', placeId], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['stings'] });
    },
    onError: (error) => showApiErrorToast(error),
  });

  function chooseSource(kind: 'cover' | 'gallery') {
    if (!place || readOnly || busy) {
      return;
    }
    const remaining = kind === 'cover' ? 1 : Math.max(GALLERY_MAX - place.gallery.length, 0);
    if (remaining === 0) {
      showMessageToast('errors.MEDIA_LIMIT');
      return;
    }
    Alert.alert(kind === 'cover' ? t('partner.cover') : t('partner.gallery'), t('partner.photoDisclaimer'), [
      { text: t('partner.takePhoto'), onPress: () => scheduleUpload(kind, 'camera', 1) },
      { text: t('partner.chooseLibrary'), onPress: () => scheduleUpload(kind, 'library', remaining) },
      { text: t('camera.cancel'), style: 'cancel' },
    ]);
  }

  function scheduleUpload(kind: 'cover' | 'gallery', source: PlaceMediaSource, limit: number) {
    // Alert ещё закрывается, и iOS не даёт выбрать фото, если галерея открывается сразу.
    setTimeout(() => {
      void upload(kind, source, limit);
    }, 350);
  }

  async function upload(kind: 'cover' | 'gallery', source: PlaceMediaSource, limit: number) {
    setBusy(true);
    try {
      const uris = await pickPlaceImages({ source, selectionLimit: limit });
      if (uris.length === 0) {
        return;
      }
      await refresh.mutateAsync({ uris, kind, source });
    } catch (error) {
      if (error instanceof PlaceLibraryPermissionError) {
        showMessageToast('partner.libraryDenied');
        return;
      }
      showApiErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(mediaId: string) {
    if (!placeId || readOnly) {
      return;
    }
    try {
      const next = await placesApi.deletePlaceMedia(placeId, mediaId);
      queryClient.setQueryData(['place', placeId], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['stings'] });
    } catch (error) {
      showApiErrorToast(error);
    }
  }

  return (
    <ScreenBackground>
      <ModalHeader backLabel={t('hive.back')} title={t('partner.mediaTitle')} />
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20 }}>
        <Text className="font-inter text-xs leading-5 text-hive-muted">{t('partner.photoDisclaimer')}</Text>
        <Text className="font-inter text-sm font-semibold text-hive-foreground">{t('partner.cover')}</Text>
        {place?.cover ? (
          <Pressable disabled={readOnly} onLongPress={() => void remove(place.cover!.id)}>
            <Image source={{ uri: place.cover.imageUrl }} style={{ width: '100%', height: 220, borderRadius: 16 }} />
          </Pressable>
        ) : (
          <Text className="font-inter text-sm text-hive-muted">{t('partner.addCover')}</Text>
        )}
        {readOnly ? null : (
          <Pressable className="h-12 items-center justify-center rounded-full bg-hive-primary" onPress={() => chooseSource('cover')}>
            <Text className="font-inter font-bold text-hive-on-accent">{t('partner.addCover')}</Text>
          </Pressable>
        )}
        <Text className="font-inter text-sm font-semibold text-hive-foreground">{t('partner.gallery')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {(place?.gallery ?? []).map((item) => (
            <Pressable key={item.id} disabled={readOnly} onLongPress={() => void remove(item.id)}>
              <Image source={{ uri: item.thumbnailUrl }} style={{ width: 96, height: 96, borderRadius: 12 }} />
            </Pressable>
          ))}
        </View>
        {readOnly ? null : (
          <Pressable className="h-12 items-center justify-center rounded-full bg-hive-surface" onPress={() => chooseSource('gallery')}>
            <Text className="font-inter font-semibold text-hive-foreground">{t('partner.addGallery')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}
