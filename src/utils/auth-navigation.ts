import { router, type Href } from 'expo-router';

import { useAuthStore } from '@/src/stores/authStore';
import type { OtpPurpose } from '@/src/types';

export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function verifyOtpHref(email: string, purpose: OtpPurpose): Href {
  return `/(auth)/verify-otp?email=${encodeURIComponent(email)}&purpose=${purpose}` as Href;
}

export function resetPasswordHref(email: string): Href {
  return `/(auth)/reset-password?email=${encodeURIComponent(email)}` as Href;
}

export function forgotPasswordHref(email?: string): Href {
  if (!email) {
    return '/(auth)/forgot-password' as Href;
  }

  return `/(auth)/forgot-password?email=${encodeURIComponent(email)}` as Href;
}

export function privacyPolicyHref(): Href {
  return '/(auth)/privacy-policy' as Href;
}

export function exitOnboarding() {
  if (useAuthStore.getState().status === 'authenticated') {
    router.replace('/settings' as Href);
    return;
  }

  router.replace('/(auth)/login' as Href);
}
