import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, ScrollView, Text, TextInput, View } from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import * as placesApi from '@/src/api/places';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { SocialLinkIcon } from '@/src/components/profile/SocialLinkIcon';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useKeyboardAwareScroll } from '@/src/hooks/useKeyboardAwareScroll';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { showInfoToast } from '@/src/stores/toastStore';
import {
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_SOCIAL_LINK_MAX_LENGTH,
  SOCIAL_LINK_KEYS,
  type Place,
  type PlaceMediaSource,
  type SocialLinkKey,
  type UserSocialLinks,
} from '@/src/types';
import { editableSocialLinkKeys, normalizeUserSocialLinks } from '@/src/utils/social-links';
import { trackEvent } from '@/src/utils/analytics-queue';
import { contactPhone } from '@/src/utils/contact-phone';
import { getApiErrorCode, getApiErrorDetails } from '@/src/utils/api-error';
import { PlaceLibraryPermissionError, pickPlaceImages } from '@/src/utils/pick-place-image';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';
import { removePlaceFromNearbyQueries } from '@/src/utils/stings-query-cache';

function socialDraftsFromLinks(links: UserSocialLinks | undefined): Record<SocialLinkKey, string> {
  const normalized = normalizeUserSocialLinks(links);
  return SOCIAL_LINK_KEYS.reduce(
    (acc, key) => {
      acc[key] = normalized[key] ?? '';
      return acc;
    },
    {} as Record<SocialLinkKey, string>,
  );
}

function socialLinksForSave(
  current: UserSocialLinks | undefined,
  drafts: Record<SocialLinkKey, string> | null,
  instagramLinksAllowed: boolean,
): UserSocialLinks {
  const source = drafts ?? socialDraftsFromLinks(current);
  const links = SOCIAL_LINK_KEYS.reduce(
    (acc, key) => {
      const trimmed = source[key].trim();
      acc[key] = trimmed.length > 0 ? trimmed : null;
      return acc;
    },
    {} as UserSocialLinks,
  );
  if (!instagramLinksAllowed) {
    links.instagram = current?.instagram ?? null;
  }
  return links;
}

function validationPaths(error: unknown): string[] {
  const fields = getApiErrorDetails(error)?.fields;
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.flatMap((item) => {
    if (!item || typeof item !== 'object' || !('path' in item) || typeof item.path !== 'string') {
      return [];
    }
    return [item.path];
  });
}

export default function PlaceEditScreen() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const keyboardScroll = useKeyboardAwareScroll();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const placeId = typeof params.placeId === 'string' ? params.placeId : null;
  const placeQuery = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => placesApi.getPlace(placeId!),
    enabled: placeId !== null,
  });
  const place = placeQuery.data?.place;
  const instagramLinksAllowed = usePreferencesStore((state) => state.instagramLinksAllowed);
  const visibleSocialKeys = editableSocialLinkKeys(instagramLinksAllowed);
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [socialDrafts, setSocialDrafts] = useState<Record<SocialLinkKey, string> | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const nextName = (name ?? place?.name ?? '').trim();
      if (nextName.length < 2) {
        throw new Error('name');
      }
      const nextPhone = contactPhone(phone ?? place?.phone ?? '');
      if (nextPhone === undefined) {
        throw new Error('phone');
      }
      const socialLinks = socialLinksForSave(place?.socialLinks, socialDrafts, instagramLinksAllowed);
      return placesApi.updatePlace(placeId!, {
        name: nextName,
        description: (description ?? place?.description ?? '').trim().slice(0, PROFILE_BIO_MAX_LENGTH) || null,
        phone: nextPhone,
        socialLinks,
      });
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['place', placeId], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      showInfoToast({
        message: t(next.status === 'draft' ? 'partner.savedDraft' : 'partner.saved'),
      });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'name') {
        showMessageToast('partner.nameRequired', 'partner.editTitle');
        return;
      }
      if (error instanceof Error && error.message === 'phone') {
        showMessageToast('partner.phoneInvalid', 'partner.editTitle');
        return;
      }
      const paths = validationPaths(error);
      if (getApiErrorCode(error) === 'VALIDATION_ERROR' && paths.includes('phone')) {
        showMessageToast('partner.phoneInvalid', 'partner.editTitle');
        return;
      }
      showApiErrorToast(error, { titleKey: 'partner.editTitle' });
    },
  });

  const visibility = useMutation({
    mutationFn: () => (place?.status === 'live' ? placesApi.pausePlace(placeId!) : placesApi.resumePlace(placeId!)),
    onSuccess: (next) => {
      queryClient.setQueryData(['place', placeId], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      if (next.status === 'paused') {
        removePlaceFromNearbyQueries(queryClient, next.id);
        showInfoToast({ message: t('partner.removedFromMap') });
      }
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
    },
    onError: (error) => showApiErrorToast(error),
  });

  const coverUpload = useMutation({
    mutationFn: (input: { uri: string; source: PlaceMediaSource }) =>
      placesApi.uploadPlaceMedia({
        placeId: placeId!,
        photoUri: input.uri,
        kind: 'cover',
        source: input.source,
      }),
    onSuccess: (result, input) => {
      queryClient.setQueryData(['place', placeId], { place: result.place, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      trackEvent('place_cover_uploaded', { props: { source: input.source } });
      if (result.wentLive) {
        trackEvent('place_went_live');
      }
    },
  });

  const discardDraft = useMutation({
    mutationFn: () => placesApi.deletePlace(placeId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      showInfoToast({ message: t('partner.draftDeleted') });
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(modals)/partner/places' as Href);
    },
    onError: (error) => showApiErrorToast(error, { titleKey: 'partner.editTitle' }),
  });

  if (!placeId || !place) {
    return (
      <ScreenBackground>
        <ModalHeader backLabel={t('hive.back')} title={t('partner.editTitle')} />
      </ScreenBackground>
    );
  }

  const shareUrl = placesApi.placeShareUrl(place.id);
  const readOnly = place.status === 'suspended';
  const savedSocialLinks = place.socialLinks;

  function updateSocialDraft(key: SocialLinkKey, value: string) {
    setSocialDrafts((drafts) => {
      const base = drafts ?? socialDraftsFromLinks(savedSocialLinks);
      return { ...base, [key]: value.slice(0, PROFILE_SOCIAL_LINK_MAX_LENGTH) };
    });
  }

  function confirmHide() {
    Alert.alert(t('partner.removeFromMapTitle'), t('partner.removeFromMapMessage'), [
      { text: t('sting.deleteCancel'), style: 'cancel' },
      { text: t('partner.pause'), style: 'destructive', onPress: () => visibility.mutate() },
    ]);
  }

  function confirmDeleteDraft() {
    Alert.alert(t('partner.deleteDraftTitle'), t('partner.deleteDraftMessage'), [
      { text: t('sting.deleteCancel'), style: 'cancel' },
      { text: t('partner.deleteDraft'), style: 'destructive', onPress: () => discardDraft.mutate() },
    ]);
  }

  function scheduleCoverUpload(source: PlaceMediaSource) {
    setTimeout(() => {
      void uploadCover(source);
    }, 350);
  }

  async function uploadCover(source: PlaceMediaSource) {
    setCoverBusy(true);
    try {
      const uris = await pickPlaceImages({ source, selectionLimit: 1 });
      const uri = uris[0];
      if (!uri) {
        return;
      }
      await coverUpload.mutateAsync({ uri, source });
    } catch (error) {
      if (error instanceof PlaceLibraryPermissionError) {
        showMessageToast('partner.libraryDenied', 'partner.cover');
        return;
      }
      showApiErrorToast(error, { titleKey: 'partner.cover' });
    } finally {
      setCoverBusy(false);
    }
  }

  async function removeCover() {
    const coverId = place?.cover?.id;
    if (!placeId || !coverId) {
      return;
    }
    setCoverBusy(true);
    try {
      const next = await placesApi.deletePlaceMedia(placeId, coverId);
      queryClient.setQueryData(['place', placeId], { place: next, viewerIsOwner: true });
      void queryClient.invalidateQueries({ queryKey: ['places', 'me'] });
      removePlaceFromNearbyQueries(queryClient, next.id);
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
    } catch (error) {
      showApiErrorToast(error, { titleKey: 'partner.cover' });
    } finally {
      setCoverBusy(false);
    }
  }

  function showCoverOptions() {
    if (readOnly || coverBusy) {
      return;
    }
    Alert.alert(
      t('partner.cover'),
      t('partner.photoDisclaimer'),
      [
        { text: t('partner.takePhoto'), onPress: () => scheduleCoverUpload('camera') },
        { text: t('partner.chooseLibrary'), onPress: () => scheduleCoverUpload('library') },
        { text: t('sting.deleteCancel'), style: 'cancel' },
        ...(place?.cover
          ? [{ text: t('profile.avatarRemove'), style: 'destructive' as const, onPress: () => void removeCover() }]
          : []),
      ],
      { cancelable: true },
    );
  }

  return (
    <ScreenBackground>
      <ModalHeader backLabel={t('hive.back')} title={place.name} />
      <ScrollView
        ref={keyboardScroll.scrollRef}
        contentContainerStyle={{ gap: 16, padding: 20, paddingBottom: 32 + keyboardScroll.bottomInset }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        onScroll={keyboardScroll.onScroll}
      >
        <PlaceCoverEditor
          busy={coverBusy}
          editable={!readOnly}
          place={place}
          onLongPress={
            place.cover && !readOnly
              ? () =>
                  Alert.alert(t('profile.avatarRemove'), undefined, [
                    { text: t('sting.deleteCancel'), style: 'cancel' },
                    { text: t('profile.avatarRemove'), style: 'destructive', onPress: () => void removeCover() },
                  ], { cancelable: true })
              : undefined
          }
          onPress={showCoverOptions}
        />
        <Text className="font-inter text-sm text-hive-muted">{t(`partner.status.${place.status}`)}</Text>
        <LabeledInput
          editable={!readOnly}
          label={t('partner.brandName')}
          value={name ?? place.name}
          onChangeText={setName}
          onFocusField={keyboardScroll.onFieldFocus}
        />
        <LabeledInput
          editable={!readOnly}
          label={t('partner.description')}
          maxLength={PROFILE_BIO_MAX_LENGTH}
          multiline
          placeholder={t('partner.descriptionPlaceholder')}
          value={description ?? place.description ?? ''}
          onChangeText={setDescription}
          onFocusField={keyboardScroll.onFieldFocus}
        />
        <Text className="-mt-3 text-right font-inter text-xs text-hive-muted">
          {t('profile.bioCounter', {
            count: (description ?? place.description ?? '').length,
            max: PROFILE_BIO_MAX_LENGTH,
          })}
        </Text>
        <View className="gap-3">
          <Text className="font-inter text-sm font-semibold text-hive-foreground">{t('profile.socialTitle')}</Text>
          <Text className="font-inter text-xs leading-4 text-hive-muted">{t('profile.socialHint')}</Text>
          {visibleSocialKeys.map((key) => (
            <SocialLinkField
              key={key}
              editable={!readOnly}
              socialKey={key}
              value={socialDrafts?.[key] ?? place.socialLinks?.[key] ?? ''}
              onChangeText={(value) => updateSocialDraft(key, value)}
              onFocusField={keyboardScroll.onFieldFocus}
            />
          ))}
        </View>
        <LabeledInput
          editable={!readOnly}
          keyboardType="phone-pad"
          label={t('partner.phone')}
          placeholder={t('partner.phonePlaceholder')}
          value={phone ?? place.phone ?? ''}
          onChangeText={setPhone}
          onFocusField={keyboardScroll.onFieldFocus}
        />
        {readOnly ? null : (
          <AuthButton loading={save.isPending} showArrow={false} title={t('partner.save')} onPress={() => save.mutate()} />
        )}
        {place.status === 'live' || place.status === 'paused' ? (
          <AuthButton
            loading={visibility.isPending}
            showArrow={false}
            title={place.status === 'live' ? t('partner.pause') : t('partner.resume')}
            onPress={() => (place.status === 'live' ? confirmHide() : visibility.mutate())}
          />
        ) : null}
        {place.status === 'draft' ? (
          <AuthButton
            loading={discardDraft.isPending}
            showArrow={false}
            title={t('partner.deleteDraft')}
            onPress={confirmDeleteDraft}
          />
        ) : null}
        <View className="items-center gap-3 rounded-2xl bg-hive-surface p-4">
          <QRCode backgroundColor="transparent" color={theme.text} size={160} value={shareUrl} />
          <Text className="text-center font-inter text-xs text-hive-muted">{shareUrl}</Text>
          <AuthButton
            showArrow={false}
            title={t('partner.share')}
            onPress={() => void Share.share({ message: shareUrl, url: shareUrl })}
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function PlaceCoverEditor({
  place,
  editable,
  busy,
  onPress,
  onLongPress,
}: {
  place: Place;
  editable: boolean;
  busy: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const coverUrl = place.cover?.imageUrl ?? null;

  return (
    <Pressable
      accessibilityLabel={t('partner.addCover')}
      accessibilityRole="button"
      disabled={!editable || busy}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      <View style={{ height: 220, borderRadius: 16 }}>
        {coverUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: 220, borderRadius: 16, backgroundColor: theme.surface }}
          />
        ) : (
          <View
            className="h-full items-center justify-center"
            style={{ borderRadius: 16, backgroundColor: theme.accentSoft }}
          >
            <Text className="font-inter text-sm" style={{ color: theme.textMuted }}>
              {t('partner.addCover')}
            </Text>
          </View>
        )}
        {busy ? (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <HiveLoader color="#FFFFFF" size="small" />
          </View>
        ) : null}
        {editable ? (
          <View
            className="absolute items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              right: 12,
              bottom: 12,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: theme.bg,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Camera color={theme.accent} size={18} strokeWidth={2.4} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  multiline = false,
  maxLength,
  onFocusField,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
  maxLength?: number;
  onFocusField?: (field: View | null) => void;
}) {
  const fieldRef = useRef<View>(null);

  return (
    <View ref={fieldRef} className="gap-2" collapsable={false}>
      <Text className="font-inter text-sm font-semibold text-hive-foreground">{label}</Text>
      <TextInput
        className={`rounded-hive-md border border-hive-stroke bg-hive-input-bg px-4 py-3 font-inter text-base text-hive-foreground ${multiline ? 'min-h-[96px]' : ''}`}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#9C9287"
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocusField?.(fieldRef.current)}
      />
    </View>
  );
}

function SocialLinkField({
  socialKey,
  value,
  editable,
  onChangeText,
  onFocusField,
}: {
  socialKey: SocialLinkKey;
  value: string;
  editable: boolean;
  onChangeText: (value: string) => void;
  onFocusField?: (field: View | null) => void;
}) {
  const { t } = useTranslation();
  const fieldRef = useRef<View>(null);
  const meta = SOCIAL_LINK_META[socialKey];

  return (
    <View ref={fieldRef} className="gap-1.5" collapsable={false}>
      <View className="flex-row items-center gap-2">
        <SocialLinkIcon socialKey={socialKey} />
        <Text className="font-inter text-sm font-semibold text-hive-foreground">{t(meta.labelKey)}</Text>
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-hive-md border border-hive-stroke bg-hive-input-bg px-4 py-3 font-inter text-base text-hive-foreground"
        editable={editable}
        maxLength={PROFILE_SOCIAL_LINK_MAX_LENGTH}
        placeholder={t(`profile.socialPlaceholder.${socialKey}`)}
        placeholderTextColor="#9C9287"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocusField?.(fieldRef.current)}
      />
    </View>
  );
}
