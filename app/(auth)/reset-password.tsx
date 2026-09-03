import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { AuthBackButton } from '@/src/components/auth/AuthBackButton';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { OtpResendButton } from '@/src/components/auth/OtpResendButton';
import { useResendCooldown } from '@/src/hooks/useResendCooldown';
import { useAuthStore } from '@/src/stores/authStore';
import { showInfoToast } from '@/src/stores/toastStore';
import { forgotPasswordHref, goBackOrReplace } from '@/src/utils/auth-navigation';
import { getApiErrorCode, getApiErrorMessage, logApiError } from '@/src/utils/api-error';
import { maskEmail, normalizeEmail } from '@/src/utils/email';
import { firstRouteParam, isOtpComplete, OTP_RESEND_HINT_CODES } from '@/src/utils/otp';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const otpResendAvailableAt = useAuthStore((state) => state.otpResendAvailableAt);

  const email = useMemo(() => {
    const fromParams = firstRouteParam(params.email);
    return normalizeEmail(fromParams || pendingEmail || '');
  }, [params.email, pendingEmail]);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [emphasizeResend, setEmphasizeResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { remainingSec, isCoolingDown } = useResendCooldown(otpResendAvailableAt);
  const maskedEmail = email ? maskEmail(email) : '';

  async function handleSubmit() {
    setError(null);
    setPasswordError(undefined);
    setConfirmError(undefined);
    setEmphasizeResend(false);

    if (!email) {
      setError(t('auth.verifyOtpMissingEmail'));
      return;
    }

    if (!isOtpComplete(code)) {
      setError(t('auth.otpIncomplete'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('auth.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ email, code, newPassword });
      if (result === 'session') {
        router.replace('/(tabs)');
        return;
      }

      showInfoToast({ message: t('auth.passwordUpdated') });
      router.replace('/(auth)/login' as Href);
    } catch (err) {
      logApiError('auth.resetPassword', err);
      const errorCode = getApiErrorCode(err);
      setEmphasizeResend(Boolean(errorCode && OTP_RESEND_HINT_CODES.has(errorCode)));
      if (errorCode === 'VALIDATION_ERROR') {
        setPasswordError(getApiErrorMessage(err, 'errors.VALIDATION_ERROR'));
      } else {
        setError(getApiErrorMessage(err, 'auth.resetPasswordFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || isCoolingDown || resending) {
      return;
    }

    setResending(true);
    setError(null);

    try {
      await resendOtp({ email, purpose: 'password_reset' });
      setCode('');
      setEmphasizeResend(false);
    } catch (err) {
      logApiError('auth.resendOtp', err);
      const errorCode = getApiErrorCode(err);
      setEmphasizeResend(Boolean(errorCode && OTP_RESEND_HINT_CODES.has(errorCode)));
      setError(getApiErrorMessage(err, 'auth.resendFailed'));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenLayout>
      <AuthBackButton
        accessibilityLabel={t('auth.back')}
        onPress={() => goBackOrReplace(forgotPasswordHref())}
      />
      <AuthLogo subtitle={t('auth.resetPasswordSubtitle')} />

      <AuthFormCard
        title={t('auth.resetPasswordTitle')}
        subtitle={
          maskedEmail
            ? t('auth.resetPasswordCardSubtitle', { email: maskedEmail })
            : t('auth.verifyOtpMissingEmail')
        }
      >
        <OtpInput
          accessibilityLabel={t('auth.otpInputLabel')}
          disabled={!email || loading}
          error={Boolean(error)}
          value={code}
          onChange={(next) => {
            setError(null);
            setCode(next);
          }}
        />

        <AuthInput
          autoCapitalize="none"
          autoComplete="new-password"
          error={passwordError}
          icon={Lock}
          label={t('auth.newPassword')}
          placeholder={t('common.passwordPlaceholder')}
          secureTextEntry
          textContentType="newPassword"
          value={newPassword}
          onChangeText={(value) => {
            setPasswordError(undefined);
            setNewPassword(value);
          }}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="new-password"
          error={confirmError}
          icon={Lock}
          label={t('auth.confirmPassword')}
          placeholder={t('common.passwordPlaceholder')}
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmError(undefined);
            setConfirmPassword(value);
          }}
        />

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <AuthButton
          disabled={!email}
          loading={loading}
          title={t('auth.resetPasswordSubmit')}
          onPress={() => void handleSubmit()}
        />

        <OtpResendButton
          emphasize={emphasizeResend}
          loading={resending}
          remainingSec={remainingSec}
          onPress={() => {
            void handleResend();
          }}
        />
      </AuthFormCard>
    </AuthScreenLayout>
  );
}
