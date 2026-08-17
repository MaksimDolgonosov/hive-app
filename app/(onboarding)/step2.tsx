import { router, type Href } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingScreen, ONBOARDING_TOTAL_STEPS } from '@/src/components/onboarding/OnboardingScreen';

export default function OnboardingStep2Screen() {
  const { t } = useTranslation();

  return (
    <OnboardingScreen
      actionLabel={t('onboarding.next')}
      description={t('onboarding.step2Description')}
      icon={Clock}
      step={3}
      title={t('onboarding.step2Title')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => router.push('/(onboarding)/step3' as Href)}
    />
  );
}
