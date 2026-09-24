import { isAxiosError } from 'axios';
import { router, type Href } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import * as partnerApi from '@/src/api/partner';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { VenuePointMap } from '@/src/components/partner/VenuePointMap';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useKeyboardAwareScroll } from '@/src/hooks/useKeyboardAwareScroll';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import type { GeoPoint, PartnerApplication, PlaceCategory } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';
import { getApiErrorCode, getApiErrorDetails } from '@/src/utils/api-error';
import { contactPhone } from '@/src/utils/contact-phone';
import { showApiErrorToast, showMessageToast } from '@/src/utils/show-toast';

const CATEGORIES: PlaceCategory[] = ['cafe', 'bar', 'restaurant', 'other'];
const CONTACT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

export default function PartnerApplyScreen() {
  const { t } = useTranslation();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const keyboardScroll = useKeyboardAwareScroll();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('cafe');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const liveCoords = useLocationStore((state) => state.coords);
  const lastKnownCoords = useLocationStore((state) => state.lastKnownCoords);
  const here: GeoPoint | null = liveCoords
    ? { lat: liveCoords.latitude, lng: liveCoords.longitude }
    : lastKnownCoords
      ? { lat: lastKnownCoords.latitude, lng: lastKnownCoords.longitude }
      : null;
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    trackEvent('partner_apply_started');
    void partnerApi.listApplications().then((applications) => {
      const draft = applications.find((item) => item.status === 'draft');
      if (!draft) {
        return;
      }
      setApplicationId(draft.id);
      setBrandName(draft.brandName);
      setCategory(draft.category);
      setPhone(draft.phone ?? '');
      setEmail(draft.contactEmail);
      setWebsite(draft.listingUrls.website ?? '');
    }).catch((error: unknown) => {
      showApiErrorToast(error);
    }).finally(() => {
      setDraftReady(true);
    });
  }, []);

  async function saveDraft(input: Parameters<typeof partnerApi.createApplication>[0]): Promise<PartnerApplication> {
    if (applicationId) {
      return partnerApi.updateApplication(applicationId, input);
    }

    try {
      return await partnerApi.createApplication(input);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code !== 'RATE_LIMITED' && code !== 'APPLICATION_RATE_LIMITED') {
        throw error;
      }

      const draft = (await partnerApi.listApplications()).find((item) => item.status === 'draft');
      if (!draft) {
        throw error;
      }

      setApplicationId(draft.id);
      return partnerApi.updateApplication(draft.id, input);
    }
  }

  function showValidationError(error: unknown) {
    const paths = validationPaths(error);
    if (paths.includes('phone')) {
      showMessageToast('partner.phoneInvalid', 'partner.applyTitle');
      return;
    }
    if (paths.includes('contactEmail')) {
      showMessageToast('partner.emailRequired', 'partner.applyTitle');
      return;
    }
    if (paths.some((path) => path === 'lat' || path === 'lng' || path.endsWith('.lat') || path.endsWith('.lng'))) {
      showMessageToast('partner.coordsRejected', 'partner.applyTitle');
      return;
    }
    const serverMessage = isAxiosError<{ error?: { message?: string } }>(error)
      ? error.response?.data?.error?.message
      : undefined;
    if (serverMessage?.includes('formatted')) {
      showMessageToast('partner.serverStillNeedsAddress', 'partner.applyTitle');
      return;
    }
    showApiErrorToast(error, { titleKey: 'partner.applyTitle' });
  }

  function showIncompleteApplication(error: unknown) {
    const missing = getApiErrorDetails(error)?.missing;
    const fields = Array.isArray(missing) ? missing.filter((item): item is string => typeof item === 'string') : [];
    if (fields.includes('contactEmail')) {
      showMessageToast('partner.emailRequired', 'partner.applyTitle');
      return;
    }
    if (fields.includes('brandName')) {
      showMessageToast('partner.nameRequired', 'partner.applyTitle');
      return;
    }
    if (fields.includes('onsite') || fields.includes('address.formatted')) {
      showMessageToast('partner.serverStillNeedsOnsite', 'partner.applyTitle');
      return;
    }
    showMessageToast('partner.locationRequired', 'partner.applyTitle');
  }

  async function handleContinue() {
    if (saving || !draftReady) {
      return;
    }
    if (brandName.trim().length < 2) {
      showMessageToast('partner.nameRequired', 'partner.applyTitle');
      return;
    }
    if (!CONTACT_EMAIL.test(email.trim())) {
      showMessageToast('partner.emailRequired', 'partner.applyTitle');
      return;
    }
    const normalizedPhone = contactPhone(phone);
    if (normalizedPhone === undefined) {
      showMessageToast('partner.phoneInvalid', 'partner.applyTitle');
      return;
    }
    setSaving(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        showMessageToast('partner.locationRequired', 'partner.applyTitle');
        return;
      }

      const fix = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Location unavailable')), 12_000);
        }),
      ]);
      const input = {
        brandName: brandName.trim(),
        category,
        address: {
          lat: fix.coords.latitude,
          lng: fix.coords.longitude,
        },
        phone: normalizedPhone,
        contactEmail: email.trim(),
        listingUrls: {
          instagram: null,
          website: website.trim() || null,
          ymaps: null,
          twogis: null,
        },
      };
      const application = await saveDraft(input);
      const submitted = await partnerApi.submitApplication(application.id, {
        lat: fix.coords.latitude,
        lng: fix.coords.longitude,
      });
      trackEvent('partner_application_submitted');
      await refreshUser();
      router.replace(`/(modals)/partner/place/edit?placeId=${submitted.placeId}` as Href);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'RATE_LIMITED' || code === 'APPLICATION_RATE_LIMITED') {
        showMessageToast('errors.APPLICATION_RATE_LIMITED', 'partner.applyTitle');
      } else if (code === 'APPLICATION_INCOMPLETE') {
        showIncompleteApplication(error);
      } else if (code === 'VALIDATION_ERROR') {
        showValidationError(error);
      } else if (error instanceof Error && error.message === 'Location unavailable') {
        showMessageToast('partner.locationRequired', 'partner.applyTitle');
      } else {
        showApiErrorToast(error, { titleKey: 'partner.applyTitle' });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenBackground>
      <ModalHeader backLabel={t('hive.back')} title={t('partner.applyTitle')} />
      <ScrollView
        ref={keyboardScroll.scrollRef}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32 + keyboardScroll.bottomInset,
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        onScroll={keyboardScroll.onScroll}
      >
        <Text className="font-inter text-sm leading-5 text-hive-muted">{t('partner.applySubtitle')}</Text>
        <Field required label={t('partner.brandName')} value={brandName} placeholder={t('partner.brandPlaceholder')} onChangeText={setBrandName} onFocusField={keyboardScroll.onFieldFocus} />
        <FieldLabel required label={t('partner.category')} />
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const selected = item === category;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                className={`rounded-full px-4 py-2 ${selected ? 'bg-hive-primary' : 'bg-hive-surface'}`}
                onPress={() => setCategory(item)}
              >
                <Text className={selected ? 'font-inter text-sm font-semibold text-hive-on-accent' : 'font-inter text-sm text-hive-foreground'}>
                  {t(`partner.categories.${item}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <FieldLabel required label={t('partner.point')} />
        <Text className="font-inter text-sm leading-5 text-hive-muted">{t('partner.pointHint')}</Text>
        <VenuePointMap editable={false} camera={here} point={here} />
        <Field label={t('partner.phone')} value={phone} placeholder={t('partner.phonePlaceholder')} keyboardType="phone-pad" onChangeText={setPhone} onFocusField={keyboardScroll.onFieldFocus} />
        <Field required label={t('partner.email')} value={email} keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} onFocusField={keyboardScroll.onFieldFocus} />
        <Field label={t('partner.website')} value={website} autoCapitalize="none" onChangeText={setWebsite} onFocusField={keyboardScroll.onFieldFocus} />
        <Text className="font-inter text-xs leading-5 text-hive-muted">{t('partner.disclaimer')}</Text>
        <AuthButton
          disabled={!draftReady}
          loading={saving || !draftReady}
          title={t('partner.submit')}
          onPress={() => void handleContinue()}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  const { t } = useTranslation();

  return (
    <Text
      accessibilityLabel={required ? `${label}, ${t('partner.required')}` : label}
      className="font-inter text-sm font-semibold text-hive-foreground"
    >
      {label}
      {required ? <Text className="text-hive-primary"> *</Text> : null}
    </Text>
  );
}

function Field({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  onFocusField,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  onFocusField?: (field: View | null) => void;
}) {
  const fieldRef = useRef<View>(null);

  return (
    <View ref={fieldRef} className="gap-2" collapsable={false}>
      <FieldLabel label={label} required={required} />
      <TextInput
        autoCapitalize={autoCapitalize ?? 'sentences'}
        className="rounded-hive-md border border-hive-stroke bg-hive-input-bg px-4 py-3 font-inter text-base text-hive-foreground"
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
