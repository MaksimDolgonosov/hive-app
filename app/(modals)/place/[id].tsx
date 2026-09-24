import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import * as placesApi from '@/src/api/places';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useLocationStore } from '@/src/stores/locationStore';
import type { PlaceReportReason } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';
import { formatDistance, haversineDistance } from '@/src/utils/geo';

const REASONS: PlaceReportReason[] = ['not_a_place', 'wrong_location', 'stolen_photos', 'spam', 'other'];

export default function PlaceCardScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; source?: string }>();
  const id = typeof params.id === 'string' ? params.id : null;
  const coords = useLocationStore((state) => state.coords ?? state.lastKnownCoords);
  const [reported, setReported] = useState(false);
  const placeQuery = useQuery({
    queryKey: ['place', id],
    queryFn: () => placesApi.getPlace(id!),
    enabled: id !== null,
  });
  const stingsQuery = useQuery({
    queryKey: ['place-stings', id],
    queryFn: () => placesApi.getPlaceStings(id!),
    enabled: id !== null && placeQuery.data?.place.hidden !== true && placeQuery.data?.place.status !== 'suspended',
  });

  useEffect(() => {
    if (!id) {
      return;
    }
    trackEvent('place_card_opened');
    if (params.source === 'deeplink') {
      trackEvent('place_deeplink_opened');
    }
  }, [id, params.source]);

  const distanceLabel = useMemo(() => {
    const place = placeQuery.data?.place;
    if (!place || !coords || place.hidden) {
      return null;
    }
    return formatDistance(
      haversineDistance(
        { lat: coords.latitude, lng: coords.longitude },
        place.center,
      ),
    );
  }, [coords, placeQuery.data?.place]);

  const place = placeQuery.data?.place;
  const outside = useMemo(() => {
    if (!place || !coords) {
      return false;
    }
    return haversineDistance({ lat: coords.latitude, lng: coords.longitude }, place.center) > place.radiusM;
  }, [coords, place]);

  function openCamera() {
    router.push('/(modals)/camera' as Href);
  }

  function report() {
    if (!id) {
      return;
    }
    Alert.alert(
      t('place.reportTitle'),
      undefined,
      REASONS.map((reason) => ({
        text: t(`place.reasons.${reason}`),
        onPress: () => {
          void placesApi
            .reportPlace(id, reason)
            .then(() => {
              setReported(true);
              trackEvent('place_report_submitted');
              showMessageToast('place.reportSent');
            })
            .catch((error: unknown) => showApiErrorToast(error));
        },
      })),
    );
  }

  return (
    <ScreenBackground>
      <ModalHeader backLabel={t('hive.back')} title={place?.name ?? t('place.badge')} />
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20, paddingBottom: 40 }}>
        {placeQuery.isError ? <Text className="font-inter text-sm text-hive-muted">{t('place.loadError')}</Text> : null}
        {place?.hidden ? (
          <View className="gap-2 rounded-2xl bg-hive-surface p-4">
            <Text className="font-display text-lg font-bold text-hive-foreground">{t('place.hiddenTitle')}</Text>
            <Text className="font-inter text-sm text-hive-muted">{t('place.hiddenBody')}</Text>
          </View>
        ) : null}
        {place && !place.hidden ? (
          <>
            {place.cover ? (
              <Image source={{ uri: place.cover.imageUrl }} style={{ width: '100%', height: 240, borderRadius: 18 }} />
            ) : null}
            <View className="flex-row items-center gap-2">
              <Text className="font-display text-2xl font-bold text-hive-foreground">{place.name}</Text>
            </View>
            <Text className="font-inter text-sm font-semibold text-hive-primary">{t('place.badge')}</Text>
            <Text className="font-inter text-sm text-hive-muted">
              {t(`partner.categories.${place.category}`)}
              {place.address.formatted ? ` · ${place.address.formatted}` : ''}
              {distanceLabel ? ` · ${distanceLabel}` : ''}
            </Text>
            {place.description ? (
              <Text className="font-inter text-base leading-6 text-hive-foreground">{place.description}</Text>
            ) : null}
            <Pressable className="h-[52px] items-center justify-center rounded-full bg-hive-primary" onPress={openCamera}>
              <Text className="font-inter font-bold text-hive-on-accent">{t('place.shootHere')}</Text>
            </Pressable>
            {outside ? <Text className="font-inter text-xs text-hive-muted">{t('place.outsideRadius')}</Text> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {place.gallery.map((item) => (
                <Image key={item.id} source={{ uri: item.thumbnailUrl }} style={{ width: 120, height: 120, borderRadius: 12 }} />
              ))}
            </ScrollView>
            <Text className="font-inter text-sm font-semibold text-hive-foreground">{t('place.guests')}</Text>
            {(stingsQuery.data?.stings.length ?? 0) === 0 ? (
              <View className="gap-3 rounded-2xl bg-hive-surface p-4">
                <Text className="font-inter text-sm text-hive-muted">{t('place.quietTitle')}</Text>
                <Pressable onPress={openCamera}>
                  <Text className="font-inter font-semibold text-hive-primary">{t('place.quietCta')}</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {stingsQuery.data?.stings.map((sting) => (
                  <Pressable key={sting.id} onPress={() => router.push(`/(modals)/sting/${sting.id}` as Href)}>
                    <Image source={{ uri: sting.thumbnailUrl }} style={{ width: 120, height: 160, borderRadius: 12 }} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {place.hiveStage === 'hive' && place.hiveId ? (
              <Pressable onPress={() => router.push(`/(modals)/hive/${place.hiveId}` as Href)}>
                <Text className="font-inter font-semibold text-hive-primary">{t('place.openHive')}</Text>
              </Pressable>
            ) : null}
            <Pressable disabled={reported} onPress={report}>
              <Text className="font-inter text-sm text-hive-muted">{t('place.report')}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}
