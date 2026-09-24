import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import * as placesApi from '@/src/api/places';
import { SocialLinkIcon } from '@/src/components/profile/SocialLinkIcon';
import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useLocationStore } from '@/src/stores/locationStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import type { PlaceReportReason, UserSocialLinks } from '@/src/types';
import { showInfoToast } from '@/src/stores/toastStore';
import { trackEvent } from '@/src/utils/analytics-queue';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';
import { formatDistance, haversineDistance } from '@/src/utils/geo';
import { getActiveSocialLinks, normalizeUserSocialLinks, withInstagramVisibility } from '@/src/utils/social-links';
import { removePlaceFromNearbyQueries } from '@/src/utils/stings-query-cache';

const REASONS: PlaceReportReason[] = ['not_a_place', 'wrong_location', 'stolen_photos', 'spam', 'other'];

export default function PlaceCardScreen() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const instagramLinksAllowed = usePreferencesStore((state) => state.instagramLinksAllowed);
  const params = useLocalSearchParams<{ id?: string; source?: string }>();
  const id = typeof params.id === 'string' ? params.id : null;
  const queryClient = useQueryClient();
  const coords = useLocationStore((state) => state.coords ?? state.lastKnownCoords);
  const [reported, setReported] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
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

  const hideFromMap = useMutation({
    mutationFn: () => placesApi.pausePlace(id!),
    onSuccess: (next) => {
      queryClient.setQueryData(['place', id], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      removePlaceFromNearbyQueries(queryClient, next.id);
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      showInfoToast({ message: t('partner.removedFromMap') });
      if (router.canGoBack()) {
        router.back();
      }
    },
    onError: (error) => showApiErrorToast(error, { titleKey: 'place.badge' }),
  });

  function confirmHide() {
    Alert.alert(t('partner.removeFromMapTitle'), t('partner.removeFromMapMessage'), [
      { text: t('sting.deleteCancel'), style: 'cancel' },
      { text: t('partner.pause'), style: 'destructive', onPress: () => hideFromMap.mutate() },
    ]);
  }

  function openCamera() {
    router.push('/(modals)/camera' as Href);
  }

  function submitReport(reason: PlaceReportReason) {
    if (!id) {
      return;
    }
    setReportOpen(false);
    void placesApi
      .reportPlace(id, reason)
      .then(() => {
        setReported(true);
        trackEvent('place_report_submitted');
        showMessageToast('place.reportSent');
      })
      .catch((error: unknown) => showApiErrorToast(error));
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
            <PlaceSocialLinks
              links={withInstagramVisibility(normalizeUserSocialLinks(place.socialLinks), instagramLinksAllowed)}
              textColor={theme.text}
              chipColor={theme.surface}
              borderColor={theme.stroke}
            />
            <Pressable className="h-[52px] items-center justify-center rounded-full bg-hive-primary" onPress={openCamera}>
              <Text className="font-inter font-bold text-hive-on-accent">{t('place.shootHere')}</Text>
            </Pressable>
            {outside ? <Text className="font-inter text-xs text-hive-muted">{t('place.outsideRadius')}</Text> : null}
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
            {placeQuery.data?.viewerIsOwner && place.status === 'live' ? (
              <Pressable disabled={hideFromMap.isPending} onPress={confirmHide}>
                <Text className="font-inter text-sm text-hive-danger">{t('partner.pause')}</Text>
              </Pressable>
            ) : null}
            <Pressable disabled={reported} onPress={() => setReportOpen(true)}>
              <Text className="font-inter text-sm text-hive-muted">{t('place.report')}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <ReportReasonSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSelect={submitReport}
      />
    </ScreenBackground>
  );
}

function PlaceSocialLinks({
  links,
  textColor,
  chipColor,
  borderColor,
}: {
  links: UserSocialLinks;
  textColor: string;
  chipColor: string;
  borderColor: string;
}) {
  const { t } = useTranslation();
  const activeLinks = getActiveSocialLinks(links);
  if (activeLinks.length === 0) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {activeLinks.map(({ key, url }) => {
        const meta = SOCIAL_LINK_META[key];
        return (
          <Pressable
            key={key}
            accessibilityLabel={t(meta.labelKey)}
            accessibilityRole="link"
            className="flex-row items-center gap-2 rounded-full border px-3 py-2"
            style={{ backgroundColor: chipColor, borderColor }}
            onPress={() => void Linking.openURL(url)}
          >
            <SocialLinkIcon socialKey={key} />
            <Text className="font-inter text-xs font-medium" style={{ color: textColor }}>
              {t(meta.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReportReasonSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (reason: PlaceReportReason) => void;
}) {
  const { t } = useTranslation();
  const theme = useHiveTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end' }}>
      <Pressable
        accessibilityLabel={t('sting.deleteCancel')}
        accessibilityRole="button"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 28,
        }}
      >
        <Text className="mb-3 font-inter text-base font-semibold" style={{ color: theme.text }}>
          {t('place.reportTitle')}
        </Text>
        {REASONS.map((reason) => (
          <Pressable key={reason} className="py-3" onPress={() => onSelect(reason)}>
            <Text className="font-inter text-base" style={{ color: theme.text }}>
              {t(`place.reasons.${reason}`)}
            </Text>
          </Pressable>
        ))}
        <Pressable className="mt-1 py-3" onPress={onClose}>
          <Text className="font-inter text-base font-semibold" style={{ color: theme.textMuted }}>
            {t('sting.deleteCancel')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
