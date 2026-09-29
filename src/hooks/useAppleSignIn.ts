import { useCallback, useState } from 'react';

import { env } from '@/src/config/env';
import { formatAppleFullName, isAppleCancel } from '@/src/utils/apple-sign-in';

export type AppleSignInErrorKey = 'auth.appleDeveloperNotConnected' | 'auth.appleLoginFailed';

export type AppleSignInSuccess = {
  identityToken: string;
  fullName: string | null;
};

interface UseAppleSignInOptions {
  onSuccess: (result: AppleSignInSuccess) => Promise<void>;
  onError: (messageKey: AppleSignInErrorKey) => void;
}

export function isAppleSignInEnabled(): boolean {
  return env.appleSignInEnabled === true;
}

export function useAppleSignIn({ onSuccess, onError }: UseAppleSignInOptions) {
  const [isPrompting, setIsPrompting] = useState(false);

  const signInWithApple = useCallback(async () => {
    if (!isAppleSignInEnabled()) {
      onError('auth.appleDeveloperNotConnected');
      return;
    }

    setIsPrompting(true);

    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        onError('auth.appleLoginFailed');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        onError('auth.appleLoginFailed');
        return;
      }

      await onSuccess({
        identityToken: credential.identityToken,
        fullName: formatAppleFullName(credential.fullName),
      });
    } catch (error) {
      if (isAppleCancel(error)) {
        return;
      }

      onError('auth.appleLoginFailed');
    } finally {
      setIsPrompting(false);
    }
  }, [onError, onSuccess]);

  return { signInWithApple, isPrompting };
}
