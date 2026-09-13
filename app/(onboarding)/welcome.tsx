import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_CONTENT_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';
import { ONBOARDING_IMAGES } from '@/src/constants/onboarding-images';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      backgroundSource={ONBOARDING_IMAGES.welcome}
      description={t('onboarding.welcomeDescription')}
      skipLabel={t('onboarding.skip')}
      step={1}
      title={t('onboarding.welcomeTitle')}
      totalSteps={ONBOARDING_CONTENT_STEPS}
      onAction={() => router.push('/(onboarding)/step1' as Href)}
      onSkip={() => void skipOnboarding()}
    />
  );
}
