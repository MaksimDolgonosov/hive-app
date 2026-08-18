import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_CONTENT_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';
import { WelcomeMapIllustration } from '@/src/components/onboarding/OnboardingIllustrations';
import { useOnboardingSkip } from '@/src/hooks/useOnboardingSkip';

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation();
  const skipOnboarding = useOnboardingSkip();

  return (
    <OnboardingScreen
      showLanguagePicker
      actionLabel={t('onboarding.next')}
      description={t('onboarding.welcomeDescription')}
      illustration={<WelcomeMapIllustration />}
      skipLabel={t('onboarding.skip')}
      step={1}
      subtitle={t('onboarding.welcomeSubtitle')}
      title={t('onboarding.welcomeTitle')}
      totalSteps={ONBOARDING_CONTENT_STEPS}
      onAction={() => router.push('/(onboarding)/step1' as Href)}
      onSkip={() => void skipOnboarding()}
    />
  );
}
