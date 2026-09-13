import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AuthSocialButton } from '@/src/components/auth/AuthSocialButton';
import {
  isGoogleSignInConfigured,
  useGoogleSignIn,
  type GoogleSignInErrorKey,
} from '@/src/hooks/useGoogleSignIn';
import { useAuthStore } from '@/src/stores/authStore';
import { getApiErrorMessage, logApiError } from '@/src/utils/api-error';

const ICON_COLOR = '#F6F2EA';

type AuthSocialLoginProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
};

function GoogleIcon() {
  return (
    <Svg width={22} height={22} viewBox="-3 0 262 262">
      <Path
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
        fill="#4285F4"
      />
      <Path
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
        fill="#34A853"
      />
      <Path
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
        fill="#FBBC05"
      />
      <Path
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
        fill="#EB4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 305 305" fill={ICON_COLOR}>
      <Path d="M40.738 112.119c-25.785 44.745-9.393 112.648 19.121 153.82C74.092 286.523 88.502 305 108.239 305c0.372 0 0.745-0.007 1.127-0.022 9.273-0.37 15.974-3.225 22.453-5.984 7.274-3.1 14.797-6.305 26.597-6.305 11.226 0 18.39 3.101 25.318 6.099 6.828 2.954 13.861 6.01 24.253 5.815 22.232-0.414 35.882-20.352 47.925-37.941 12.567-18.365 18.871-36.196 20.998-43.01l0.086-0.271c0.405-1.211-0.167-2.533-1.328-3.066-0.032-0.015-0.15-0.064-0.183-0.078-3.915-1.601-38.257-16.836-38.618-58.36-0.335-33.736 25.763-51.601 30.997-54.839l0.244-0.152c0.567-0.365 0.962-0.944 1.096-1.606 0.134-0.661-0.006-1.349-0.386-1.905-18.014-26.362-45.624-30.335-56.74-30.813-1.613-0.161-3.278-0.242-4.95-0.242-13.056 0-25.563 4.931-35.611 8.893-6.936 2.735-12.927 5.097-17.059 5.097-4.643 0-10.668-2.391-17.645-5.159-9.33-3.703-19.905-7.899-31.1-7.899-0.267 0-0.53 0.003-0.789 0.008C78.894 73.643 54.298 88.535 40.738 112.119z" />
      <Path d="M212.101 0.002c-15.763 0.642-34.672 10.345-45.974 23.583-9.605 11.127-18.988 29.679-16.516 48.379 0.155 1.17 1.107 2.073 2.284 2.164 1.064 0.083 2.15 0.125 3.232 0.126 15.413 0 32.04-8.527 43.395-22.257 11.951-14.498 17.994-33.104 16.166-49.77C214.544 0.921 213.395-0.049 212.101 0.002z" />
    </Svg>
  );
}

function ConfiguredGoogleButton({
  disabled,
  onError,
}: {
  disabled: boolean;
  onError: (message: string | null) => void;
}) {
  const { t } = useTranslation();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const handleSuccess = useCallback(
    async (idToken: string) => {
      try {
        await loginWithGoogle({ idToken });
      } catch (err) {
        logApiError('auth.google', err);
        onError(getApiErrorMessage(err, 'auth.googleLoginFailed'));
      }
    },
    [loginWithGoogle, onError],
  );

  const handleHookError = useCallback(
    (messageKey: GoogleSignInErrorKey) => {
      onError(t(messageKey));
    },
    [onError, t],
  );

  const { signInWithGoogle, isPrompting, isReady } = useGoogleSignIn({
    onSuccess: handleSuccess,
    onError: handleHookError,
  });

  return (
    <AuthSocialButton
      accessibilityLabel={t('auth.loginWithGoogle')}
      disabled={disabled || isPrompting || !isReady}
      label={t('auth.loginWithGoogle')}
      loading={isPrompting}
      variant="row"
      onPress={() => {
        onError(null);
        void signInWithGoogle();
      }}
    >
      <GoogleIcon />
    </AuthSocialButton>
  );
}

export function AuthSocialLogin({ disabled = false, onError }: AuthSocialLoginProps) {
  const { t } = useTranslation();
  const googleConfigured = isGoogleSignInConfigured();

  return (
    <View className="w-full items-center gap-4">
      <View className="w-full flex-row items-center gap-3.5">
        <View className="h-px flex-1 bg-hive-stroke" />
        <Text className="font-inter text-xs text-hive-dim">{t('auth.orLoginVia')}</Text>
        <View className="h-px flex-1 bg-hive-stroke" />
      </View>

      {googleConfigured ? (
        <ConfiguredGoogleButton disabled={disabled} onError={onError} />
      ) : (
        <AuthSocialButton
          accessibilityLabel={t('auth.loginWithGoogle')}
          disabled={disabled}
          label={t('auth.loginWithGoogle')}
          variant="row"
          onPress={() => onError(t('auth.googleNotConfigured'))}
        >
          <GoogleIcon />
        </AuthSocialButton>
      )}

      {Platform.OS === 'ios' ? (
        <AuthSocialButton
          accessibilityLabel={t('auth.loginWithApple')}
          disabled={disabled}
          label={t('auth.loginWithApple')}
          variant="row"
          onPress={() => undefined}
        >
          <AppleIcon />
        </AuthSocialButton>
      ) : null}
    </View>
  );
}
