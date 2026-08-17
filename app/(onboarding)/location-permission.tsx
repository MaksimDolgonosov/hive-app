import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen, ONBOARDING_TOTAL_STEPS } from '@/src/components/onboarding/OnboardingScreen';

export default function OnboardingLocationPermissionScreen() {
  const { t } = useTranslation();
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
      actionLabel={t('onboarding.allowLocation')}
      description={t('onboarding.locationDescription')}
      icon={MapPin}
      loading={loading}
      step={5}
      title={t('onboarding.locationTitle')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => void handleContinue()}
    />
  );
}
