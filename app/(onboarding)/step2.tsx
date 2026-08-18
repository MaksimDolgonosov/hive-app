import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_CONTENT_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';
import { FourHoursIllustration } from '@/src/components/onboarding/OnboardingIllustrations';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingStep2Screen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      description={t('onboarding.step2Description')}
      illustration={<FourHoursIllustration />}
      skipLabel={t('onboarding.skip')}
      step={3}
      subtitle={t('onboarding.step2Subtitle')}
      title={t('onboarding.step2Title')}
      totalSteps={ONBOARDING_CONTENT_STEPS}
      onAction={() => router.push('/(onboarding)/step3' as Href)}
      onSkip={() => void skipOnboarding()}
    />
  );
}
