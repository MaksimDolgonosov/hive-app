import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';

import { env } from '@/src/config/env';

WebBrowser.maybeCompleteAuthSession();

interface UseGoogleSignInOptions {
  onSuccess: (idToken: string) => Promise<void>;
  onError: (messageKey: string) => void;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleWebClientId || env.googleIosClientId || env.googleAndroidClientId);
}

export function useGoogleSignIn({ onSuccess, onError }: UseGoogleSignInOptions) {
  const [isPrompting, setIsPrompting] = useState(false);
  const handledResponseRef = useRef<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: env.googleWebClientId || undefined,
    iosClientId: env.googleIosClientId || undefined,
    androidClientId: env.googleAndroidClientId || env.googleWebClientId || undefined,
  });

  useEffect(() => {
    if (__DEV__) {
      console.log('[google-auth] configured', {
        web: Boolean(env.googleWebClientId),
        ios: Boolean(env.googleIosClientId),
        android: Boolean(env.googleAndroidClientId),
        redirectUri: request?.redirectUri,
      });
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setIsPrompting(false);
      return;
    }

    if (response.type !== 'success') {
      setIsPrompting(false);
      onError('auth.googleLoginFailed');
      return;
    }

    const idToken =
      response.authentication?.idToken ??
      response.params?.id_token ??
      (typeof response.params?.id_token === 'string' ? response.params.id_token : undefined);

    if (!idToken) {
      setIsPrompting(false);
      onError('auth.googleLoginFailed');
      return;
    }

    if (handledResponseRef.current === idToken) {
      return;
    }

    handledResponseRef.current = idToken;
    setIsPrompting(true);

    void onSuccess(idToken).finally(() => {
      setIsPrompting(false);
    });
  }, [onError, onSuccess, response]);

  async function signInWithGoogle(): Promise<void> {
    if (!isGoogleSignInConfigured()) {
      onError('auth.googleNotConfigured');
      return;
    }

    if (!request) {
      onError('auth.googleLoginFailed');
      return;
    }

    setIsPrompting(true);
    try {
      await promptAsync();
    } catch {
      setIsPrompting(false);
      onError('auth.googleLoginFailed');
    }
  }

  return {
    signInWithGoogle,
    isPrompting,
    isReady: Boolean(request),
  };
}
