import { router, type Href } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen, ONBOARDING_TOTAL_STEPS } from '@/src/components/onboarding/OnboardingScreen';

export default function OnboardingStep1Screen() {
  const { t } = useTranslation();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      description={t('onboarding.step1Description')}
      icon={Camera}
      step={2}
      title={t('onboarding.step1Title')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => router.push('/(onboarding)/step2' as Href)}
    />
  );
}
