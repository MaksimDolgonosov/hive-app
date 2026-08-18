import { router, type Href } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/src/stores/authStore';

export function useOnboardingSkip() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  return useCallback(async () => {
    await completeOnboarding();
    router.replace('/(auth)/login' as Href);
  }, [completeOnboarding]);
}
