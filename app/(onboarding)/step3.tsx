import { router, type Href } from 'expo-router';
import { Hexagon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen, ONBOARDING_TOTAL_STEPS } from '@/src/components/onboarding/OnboardingScreen';

export default function OnboardingStep3Screen() {
  const { t } = useTranslation();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      description={t('onboarding.step3Description')}
      icon={Hexagon}
      step={4}
      title={t('onboarding.step3Title')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => router.push('/(onboarding)/location-permission' as Href)}
    />
  );
}
