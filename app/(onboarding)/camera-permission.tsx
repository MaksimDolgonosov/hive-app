import { Camera } from 'expo-camera';
import { router, type Href } from 'expo-router';
import { Camera as CameraIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen } from '@/src/components/onboarding/OnboardingScreen';
import { PermissionIllustration } from '@/src/components/onboarding/OnboardingIllustrations';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';
import { useAuthStore } from '@/src/stores/authStore';

export default function OnboardingCameraPermissionScreen() {
  const { t } = useTranslation();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const skipOnboarding = useOnboardingSkip();
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
      showPagination={false}
      actionLabel={t('onboarding.allowCamera')}
      description={t('onboarding.cameraDescription')}
      illustration={
        <PermissionIllustration>
          <CameraIcon color="#F5A623" size={56} strokeWidth={2} />
        </PermissionIllustration>
      }
      loading={loading}
      skipLabel={t('onboarding.skip')}
      subtitle={t('onboarding.cameraSubtitle')}
      title={t('onboarding.cameraTitle')}
      onAction={() => void handleContinue()}
      onSkip={() => void skipOnboarding()}
    />
  );
}
