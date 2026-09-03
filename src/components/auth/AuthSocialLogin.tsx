import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Apple } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthSocialButton } from '@/src/components/auth/AuthSocialButton';
import {
  isGoogleSignInConfigured,
  useGoogleSignIn,
  type GoogleSignInErrorKey,
} from '@/src/hooks/useGoogleSignIn';
import { useAuthStore } from '@/src/stores/authStore';
import { getApiErrorMessage, logApiError } from '@/src/utils/api-error';

const ICON_COLOR = '#2C1810';

type AuthSocialLoginProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
};

function GoogleIcon() {
  return <FontAwesome color={ICON_COLOR} name="google" size={22} />;
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
        router.replace('/(tabs)');
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
      loading={isPrompting}
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
    <View className="items-center gap-3">
      <Text className="font-inter text-[13px] text-hive-muted">{t('auth.orLoginVia')}</Text>
      <View className="flex-row items-center justify-center gap-3">
        <AuthSocialButton accessibilityLabel={t('auth.loginWithApple')}>
          <Apple color={ICON_COLOR} size={22} strokeWidth={2} />
        </AuthSocialButton>
        {googleConfigured ? (
          <ConfiguredGoogleButton disabled={disabled} onError={onError} />
        ) : (
          <AuthSocialButton
            accessibilityLabel={t('auth.loginWithGoogle')}
            disabled={disabled}
            onPress={() => onError(t('auth.googleNotConfigured'))}
          >
            <GoogleIcon />
          </AuthSocialButton>
        )}
        <AuthSocialButton accessibilityLabel={t('auth.loginWithFacebook')}>
          <FontAwesome color={ICON_COLOR} name="facebook" size={22} />
        </AuthSocialButton>
      </View>
    </View>
  );
}
