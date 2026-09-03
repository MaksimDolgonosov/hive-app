import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthBackButton } from '@/src/components/auth/AuthBackButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { OtpResendButton } from '@/src/components/auth/OtpResendButton';
import { useCountdown } from '@/src/hooks/useCountdown';
import { useResendCooldown } from '@/src/hooks/useResendCooldown';
import { useAuthStore } from '@/src/stores/authStore';
import {
  goBackOrReplace,
  resetPasswordHref,
  forgotPasswordHref,
} from '@/src/utils/auth-navigation';
import { maskEmail, normalizeEmail } from '@/src/utils/email';
import { getApiErrorCode, getApiErrorMessage, logApiError } from '@/src/utils/api-error';
import {
  firstRouteParam,
  isOtpComplete,
  OTP_RESEND_HINT_CODES,
  parseOtpPurpose,
} from '@/src/utils/otp';

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string | string[]; purpose?: string | string[] }>();
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const otpPurpose = useAuthStore((state) => state.otpPurpose);
  const otpExpiresAt = useAuthStore((state) => state.otpExpiresAt);
  const otpResendAvailableAt = useAuthStore((state) => state.otpResendAvailableAt);

  const email = useMemo(() => {
    const fromParams = firstRouteParam(params.email);
    return normalizeEmail(fromParams || pendingEmail || '');
  }, [params.email, pendingEmail]);

  const purpose = useMemo(() => {
    return parseOtpPurpose(firstRouteParam(params.purpose)) ?? otpPurpose ?? 'register';
  }, [otpPurpose, params.purpose]);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emphasizeResend, setEmphasizeResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const verifyLockRef = useRef(false);

  const { remainingSec, isCoolingDown } = useResendCooldown(otpResendAvailableAt);
  const ttl = useCountdown(
    otpExpiresAt ? new Date(otpExpiresAt).toISOString() : new Date(0).toISOString(),
  );
  const showTtl = Boolean(otpExpiresAt) && !ttl.isExpired;

  useEffect(() => {
    if (purpose !== 'password_reset') {
      return;
    }

    if (email) {
      router.replace(resetPasswordHref(email));
      return;
    }

    router.replace(forgotPasswordHref());
  }, [email, purpose]);

  const handleVerify = useCallback(
    async (nextCode: string) => {
      if (!email || verifyLockRef.current || !isOtpComplete(nextCode)) {
        return;
      }

      verifyLockRef.current = true;
      setVerifying(true);
      setError(null);

      try {
        await verifyOtp({ email, code: nextCode, purpose: 'register' });
        router.replace('/(tabs)');
      } catch (err) {
        logApiError('auth.verifyOtp', err);
        const errorCode = getApiErrorCode(err);
        setEmphasizeResend(Boolean(errorCode && OTP_RESEND_HINT_CODES.has(errorCode)));
        setError(getApiErrorMessage(err, 'auth.otpFailed'));
        setCode('');
        verifyLockRef.current = false;
      } finally {
        setVerifying(false);
      }
    },
    [email, verifyOtp],
  );

  useEffect(() => {
    if (isOtpComplete(code)) {
      void handleVerify(code);
    }
  }, [code, handleVerify]);

  async function handleResend() {
    if (!email || isCoolingDown || resending) {
      return;
    }

    setResending(true);
    setError(null);

    try {
      await resendOtp({ email, purpose: 'register' });
      setCode('');
      setEmphasizeResend(false);
      verifyLockRef.current = false;
    } catch (err) {
      logApiError('auth.resendOtp', err);
      const errorCode = getApiErrorCode(err);
      setEmphasizeResend(Boolean(errorCode && OTP_RESEND_HINT_CODES.has(errorCode)));
      setError(getApiErrorMessage(err, 'auth.resendFailed'));
    } finally {
      setResending(false);
    }
  }

  if (purpose === 'password_reset') {
    return null;
  }

  const maskedEmail = email ? maskEmail(email) : '';

  return (
    <AuthScreenLayout>
      <AuthBackButton
        accessibilityLabel={t('auth.back')}
        onPress={() => goBackOrReplace('/(auth)/register')}
      />
      <AuthLogo subtitle={t('auth.verifyOtpSubtitle')} />

      <AuthFormCard
        title={t('auth.verifyOtpTitle')}
        subtitle={
          maskedEmail
            ? t('auth.verifyOtpCardSubtitle', { email: maskedEmail })
            : t('auth.verifyOtpMissingEmail')
        }
      >
        <OtpInput
          accessibilityLabel={t('auth.otpInputLabel')}
          disabled={!email || verifying}
          error={Boolean(error)}
          value={code}
          onChange={(next) => {
            setError(null);
            setCode(next);
          }}
        />

        {showTtl ? (
          <Text className="text-center font-inter text-xs text-hive-muted">
            {t('auth.codeExpiresIn', { time: ttl.remainingLabel })}
          </Text>
        ) : null}

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <OtpResendButton
          emphasize={emphasizeResend}
          loading={resending}
          remainingSec={remainingSec}
          onPress={() => {
            void handleResend();
          }}
        />
      </AuthFormCard>

      <View className="mt-6 items-center">
        <Text className="font-inter text-sm text-hive-muted">{t('auth.verifyOtpHint')}</Text>
      </View>
    </AuthScreenLayout>
  );
}
