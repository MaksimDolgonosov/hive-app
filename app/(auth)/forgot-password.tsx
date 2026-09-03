import { router, useLocalSearchParams } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { AuthBackButton } from '@/src/components/auth/AuthBackButton';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { useAuthStore } from '@/src/stores/authStore';
import { goBackOrReplace, resetPasswordHref } from '@/src/utils/auth-navigation';
import { isValidEmail, normalizeEmail } from '@/src/utils/email';
import { getApiErrorMessage, logApiError } from '@/src/utils/api-error';
import { firstRouteParam } from '@/src/utils/otp';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const [email, setEmail] = useState(() => normalizeEmail(firstRouteParam(params.email) ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!error) {
      return undefined;
    }

    return email.trim() && !isValidEmail(email) ? error : undefined;
  }, [email, error]);

  async function handleSubmit() {
    setError(null);

    const normalized = normalizeEmail(email);
    if (!normalized) {
      setError(t('auth.fillEmail'));
      return;
    }

    if (!isValidEmail(normalized)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: normalized });
      router.push(resetPasswordHref(normalized));
    } catch (err) {
      logApiError('auth.forgotPassword', err);
      setError(getApiErrorMessage(err, 'auth.forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout>
      <AuthBackButton
        accessibilityLabel={t('auth.back')}
        onPress={() => goBackOrReplace('/(auth)/login')}
      />
      <AuthLogo subtitle={t('auth.forgotPasswordSubtitle')} />

      <AuthFormCard
        title={t('auth.forgotPasswordTitle')}
        subtitle={t('auth.forgotPasswordCardSubtitle')}
      >
        <AuthInput
          autoCapitalize="none"
          autoComplete="email"
          error={emailError}
          icon={Mail}
          keyboardType="email-address"
          label={t('common.email')}
          placeholder={t('common.emailPlaceholder')}
          textContentType="emailAddress"
          value={email}
          onChangeText={(value) => {
            setError(null);
            setEmail(value);
          }}
        />

        {error && !emailError ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <AuthButton
          loading={loading}
          title={t('auth.sendCode')}
          onPress={() => void handleSubmit()}
        />
      </AuthFormCard>
    </AuthScreenLayout>
  );
}
