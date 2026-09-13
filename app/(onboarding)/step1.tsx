import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_CONTENT_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';
import { ONBOARDING_IMAGES } from '@/src/constants/onboarding-images';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingStep1Screen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      backgroundSource={ONBOARDING_IMAGES.camera}
      description={t('onboarding.step1Description')}
      skipLabel={t('onboarding.skip')}
      step={2}
      title={t('onboarding.step1Title')}
      totalSteps={ONBOARDING_CONTENT_STEPS}
      onAction={() => router.push('/(onboarding)/step2' as Href)}
      onSkip={() => void skipOnboarding()}
    />
  );
}
