import { router, type Href } from 'expo-router';

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
