import { router, type Href } from 'expo-router';
import { Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import {
  ONBOARDING_TOTAL_STEPS,
  OnboardingScreen,
} from '@/src/components/onboarding/OnboardingScreen';

export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();

  return (
    <OnboardingScreen
      showLanguagePicker
      actionLabel={t('onboarding.next')}
      description={t('onboarding.languageDescription')}
      icon={Languages}
      step={1}
      title={t('onboarding.languageTitle')}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      onAction={() => router.push('/(onboarding)/step1' as Href)}
    />
  );
}
