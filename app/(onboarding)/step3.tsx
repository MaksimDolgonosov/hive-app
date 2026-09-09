import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_CONTENT_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';
import { ONBOARDING_IMAGES } from '@/src/constants/onboarding-images';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingStep3Screen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.start')}
      backgroundSource={ONBOARDING_IMAGES.hive}
      description={t('onboarding.step3Description')}
      skipLabel={t('onboarding.skip')}
      step={4}
      title={t('onboarding.step3Title')}
      totalSteps={ONBOARDING_CONTENT_STEPS}
      onAction={() => router.push('/(onboarding)/location-permission' as Href)}
      onSkip={() => void skipOnboarding()}
    />
  );
}
