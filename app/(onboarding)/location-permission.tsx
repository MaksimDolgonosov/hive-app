import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen } from '@/src/components/onboarding/OnboardingScreen';
import { PermissionIllustration } from '@/src/components/onboarding/OnboardingIllustrations';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingLocationPermissionScreen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await Location.requestForegroundPermissionsAsync();
      router.push('/(onboarding)/camera-permission' as Href);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingScreen
      showPagination={false}
      actionLabel={t('onboarding.allowLocation')}
      description={t('onboarding.locationDescription')}
      illustration={
        <PermissionIllustration>
          <MapPin color="#F5A623" size={56} strokeWidth={2} />
        </PermissionIllustration>
      }
      loading={loading}
      skipLabel={t('onboarding.skip')}
      subtitle={t('onboarding.locationSubtitle')}
      title={t('onboarding.locationTitle')}
      onAction={() => void handleContinue()}
      onSkip={() => void skipOnboarding()}
    />
  );
}
