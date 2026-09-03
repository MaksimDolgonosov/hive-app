import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { env } from '@/src/config/env';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInErrorKey =
  'auth.googleLoginFailed' | 'auth.googleNotConfigured' | 'auth.googleRequiresDevBuild';

interface UseGoogleSignInOptions {
  onSuccess: (idToken: string) => Promise<void>;
  onError: (messageKey: GoogleSignInErrorKey) => void;
}

function getPlatformGoogleClientId(): string {
  if (Platform.OS === 'ios') {
    return env.googleIosClientId || env.googleWebClientId || '';
  }

  if (Platform.OS === 'android') {
    return env.googleAndroidClientId || env.googleWebClientId || '';
  }

  return env.googleWebClientId || '';
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getPlatformGoogleClientId());
}

function isExpoGoRuntime(): boolean {
  return Constants.appOwnership === 'expo';
}

export function useGoogleSignIn({ onSuccess, onError }: UseGoogleSignInOptions) {
  const [isPrompting, setIsPrompting] = useState(false);
  const handledResponseRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const authConfig = useMemo(() => {
    const platformClientId = getPlatformGoogleClientId();

    return {
      webClientId: env.googleWebClientId || platformClientId,
      iosClientId: env.googleIosClientId || env.googleWebClientId || platformClientId,
      androidClientId: env.googleAndroidClientId || env.googleWebClientId || platformClientId,
    };
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest(authConfig);

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
      onErrorRef.current('auth.googleLoginFailed');
      return;
    }

    const idToken =
      response.authentication?.idToken ??
      (typeof response.params?.id_token === 'string' ? response.params.id_token : undefined);

    if (!idToken) {
      setIsPrompting(false);
      onErrorRef.current('auth.googleLoginFailed');
      return;
    }

    if (handledResponseRef.current === idToken) {
      return;
    }

    handledResponseRef.current = idToken;
    setIsPrompting(true);

    void onSuccessRef.current(idToken).finally(() => {
      setIsPrompting(false);
    });
  }, [response]);

  async function signInWithGoogle(): Promise<void> {
    if (!isGoogleSignInConfigured()) {
      onErrorRef.current('auth.googleNotConfigured');
      return;
    }

    if (isExpoGoRuntime()) {
      onErrorRef.current('auth.googleRequiresDevBuild');
      return;
    }

    if (!request) {
      onErrorRef.current('auth.googleLoginFailed');
      return;
    }

    setIsPrompting(true);
    try {
      await promptAsync();
    } catch {
      setIsPrompting(false);
      onErrorRef.current('auth.googleLoginFailed');
    }
  }

  return {
    signInWithGoogle,
    isPrompting,
    isReady: Boolean(request),
  };
}
