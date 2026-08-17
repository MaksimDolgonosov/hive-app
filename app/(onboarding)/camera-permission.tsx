import { Camera } from 'expo-camera';
import { router, type Href } from 'expo-router';
import { Camera as CameraIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen, ONBOARDING_TOTAL_STEPS } from '@/src/components/onboarding/OnboardingScreen';
import { useAuthStore } from '@/src/stores/authStore';

export default function OnboardingCameraPermissionScreen() {
  const { t } = useTranslation();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await Camera.requestCameraPermissionsAsync();
      await completeOnboarding();
      router.replace('/(auth)/login' as Href);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.allowCamera')}
      description={t('onboarding.cameraDescription')}
      icon={CameraIcon}
      loading={loading}
      step={6}
      title={t('onboarding.cameraTitle')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => void handleContinue()}
    />
  );
}
