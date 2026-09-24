import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, ScrollView, Text, TextInput, View } from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import * as placesApi from '@/src/api/places';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useKeyboardAwareScroll } from '@/src/hooks/useKeyboardAwareScroll';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { showInfoToast } from '@/src/stores/toastStore';
import { contactPhone } from '@/src/utils/contact-phone';
import { getApiErrorCode, getApiErrorDetails } from '@/src/utils/api-error';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';

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
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

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
      return placesApi.updatePlace(placeId!, {
        name: nextName,
        description: (description ?? place?.description ?? '').trim() || null,
        phone: nextPhone,
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
      void queryClient.invalidateQueries({ queryKey: ['stings'] });
    },
    onError: (error) => showApiErrorToast(error),
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
          placeholder={t('partner.descriptionPlaceholder')}
          value={description ?? place.description ?? ''}
          onChangeText={setDescription}
          onFocusField={keyboardScroll.onFieldFocus}
        />
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
        <AuthButton
          showArrow={false}
          title={t('partner.mediaTitle')}
          onPress={() => router.push(`/(modals)/partner/place/media?placeId=${place.id}` as Href)}
        />
        {place.status === 'live' || place.status === 'paused' ? (
          <AuthButton
            loading={visibility.isPending}
            showArrow={false}
            title={place.status === 'live' ? t('partner.pause') : t('partner.resume')}
            onPress={() => visibility.mutate()}
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

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  onFocusField,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  onFocusField?: (field: View | null) => void;
}) {
  const fieldRef = useRef<View>(null);

  return (
    <View ref={fieldRef} className="gap-2" collapsable={false}>
      <Text className="font-inter text-sm font-semibold text-hive-foreground">{label}</Text>
      <TextInput
        className="rounded-hive-md border border-hive-stroke bg-hive-input-bg px-4 py-3 font-inter text-base text-hive-foreground"
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9C9287"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocusField?.(fieldRef.current)}
      />
    </View>
  );
}
