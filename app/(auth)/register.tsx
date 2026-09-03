import { Link, router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { useAuthStore } from '@/src/stores/authStore';
import { getApiErrorCode, getApiErrorMessage } from '@/src/utils/api-error';
import { verifyOtpHref } from '@/src/utils/auth-navigation';
import { isValidEmail, normalizeEmail } from '@/src/utils/email';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((state) => state.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [loading, setLoading] = useState(false);

  function clearFieldErrors() {
    setUsernameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setShowLoginHint(false);
  }

  async function handleRegister() {
    setError(null);
    clearFieldErrors();

    const trimmedUsername = username.trim();
    const normalizedEmail = normalizeEmail(email);
    let hasValidationError = false;

    if (!trimmedUsername) {
      setUsernameError(t('auth.fillAllFields'));
      hasValidationError = true;
    }

    if (!normalizedEmail) {
      setEmailError(t('auth.fillAllFields'));
      hasValidationError = true;
    } else if (!isValidEmail(normalizedEmail)) {
      setEmailError(t('auth.invalidEmail'));
      hasValidationError = true;
    }

    if (!password) {
      setPasswordError(t('auth.fillAllFields'));
      hasValidationError = true;
    } else if (password.length < 8) {
      setPasswordError(t('auth.passwordMinLength'));
      hasValidationError = true;
    }

    if (hasValidationError) {
      setError(t('errors.VALIDATION_ERROR'));
      return;
    }

    setLoading(true);
    try {
      await register({
        username: trimmedUsername,
        email: normalizedEmail,
        password,
      });
      router.push(verifyOtpHref(normalizedEmail, 'register'));
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'USER_ALREADY_EXISTS') {
        setShowLoginHint(true);
        setError(getApiErrorMessage(err, 'errors.USER_ALREADY_EXISTS'));
      } else if (code === 'VALIDATION_ERROR') {
        setError(getApiErrorMessage(err, 'errors.VALIDATION_ERROR'));
      } else {
        setError(getApiErrorMessage(err, 'auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout>
      <AuthLogo subtitle={t('auth.registerSubtitle')} />

      <AuthFormCard title={t('auth.registerTitle')} subtitle={t('auth.registerCardSubtitle')}>
        <AuthInput
          autoCapitalize="words"
          autoComplete="name"
          error={usernameError}
          icon={User}
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          textContentType="name"
          value={username}
          onChangeText={(value) => {
            setUsernameError(undefined);
            setUsername(value);
          }}
        />
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
            setEmailError(undefined);
            setEmail(value);
          }}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="new-password"
          error={passwordError}
          icon={Lock}
          label={t('common.password')}
          placeholder={t('common.passwordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={(value) => {
            setPasswordError(undefined);
            setPassword(value);
          }}
        />

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        {showLoginHint ? (
          <View className="items-center">
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link">
                <Text className="font-inter text-sm font-bold text-hive-primary">
                  {t('auth.goToLogin')}
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        <AuthButton
          loading={loading}
          title={t('auth.createAccount')}
          onPress={() => void handleRegister()}
        />
      </AuthFormCard>

      <View className="mt-6 flex-row items-center justify-center gap-1">
        <Text className="font-inter text-sm text-hive-muted">{t('auth.hasAccount')}</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link">
            <Text className="font-inter text-sm font-bold text-hive-primary">
              {t('auth.login')}
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
