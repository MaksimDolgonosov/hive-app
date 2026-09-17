import { Link, router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { AuthSocialLogin } from '@/src/components/auth/AuthSocialLogin';
import { PrivacyConsentCheckbox } from '@/src/components/auth/PrivacyConsentCheckbox';
import { usePublicInvite } from '@/src/hooks/useInvites';
import { useAuthStore } from '@/src/stores/authStore';
import { loadPendingInviteCode } from '@/src/stores/invite-storage';
import { getApiErrorCode, getApiErrorMessage } from '@/src/utils/api-error';
import { privacyPolicyHref, verifyOtpHref } from '@/src/utils/auth-navigation';
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
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);
  const [privacyError, setPrivacyError] = useState<string | undefined>();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const publicInvite = usePublicInvite(inviteCode);

  useEffect(() => {
    void loadPendingInviteCode().then(setInviteCode);
  }, []);

  function clearFieldErrors() {
    setUsernameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setPrivacyError(undefined);
    setShowLoginHint(false);
  }

  function ensurePrivacyAccepted(): boolean {
    if (acceptedPrivacy) {
      setPrivacyError(undefined);
      return true;
    }

    setPrivacyError(t('auth.privacyConsentRequired'));
    setError(t('auth.privacyConsentRequired'));
    return false;
  }

  async function handleRegister() {
    setError(null);
    clearFieldErrors();

    const trimmedUsername = username.trim();
    const normalizedEmail = normalizeEmail(email);
    let hasFieldError = false;

    if (!trimmedUsername) {
      setUsernameError(t('auth.fillAllFields'));
      hasFieldError = true;
    }

    if (!normalizedEmail) {
      setEmailError(t('auth.fillAllFields'));
      hasFieldError = true;
    } else if (!isValidEmail(normalizedEmail)) {
      setEmailError(t('auth.invalidEmail'));
      hasFieldError = true;
    }

    if (!password) {
      setPasswordError(t('auth.fillAllFields'));
      hasFieldError = true;
    } else if (password.length < 8) {
      setPasswordError(t('auth.passwordMinLength'));
      hasFieldError = true;
    }

    if (!acceptedPrivacy) {
      setPrivacyError(t('auth.privacyConsentRequired'));
    }

    if (hasFieldError || !acceptedPrivacy) {
      setError(hasFieldError ? t('errors.VALIDATION_ERROR') : t('auth.privacyConsentRequired'));
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
      <AuthLogo />

      <AuthFormCard title={t('auth.registerTitle')} subtitle={t('auth.registerCardSubtitle')}>
        {publicInvite.data?.valid && publicInvite.data.ownerUsername ? (
          <Text className="mb-3 text-center font-inter text-sm font-semibold text-hive-primary">
            {t('invite.invitedBy', { username: publicInvite.data.ownerUsername })}
          </Text>
        ) : publicInvite.data && !publicInvite.data.valid ? (
          <Text className="mb-3 text-center font-inter text-sm text-hive-muted">
            {t('errors.INVITE_EXPIRED')}
          </Text>
        ) : null}
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

        <PrivacyConsentCheckbox
          checked={acceptedPrivacy}
          error={privacyError}
          onCheckedChange={(value) => {
            setAcceptedPrivacy(value);
            setPrivacyError(undefined);
            if (value) {
              setError((current) =>
                current === t('auth.privacyConsentRequired') ? null : current,
              );
            }
          }}
          onOpenPolicy={() => router.push(privacyPolicyHref())}
        />

        <AuthButton
          loading={loading}
          title={t('auth.createAccount')}
          onPress={() => void handleRegister()}
        />

        <AuthSocialLogin
          disabled={loading}
          onBeforeAuth={ensurePrivacyAccepted}
          onError={(message) => {
            setShowLoginHint(false);
            setError(message);
          }}
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
