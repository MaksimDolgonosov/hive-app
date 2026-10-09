import { Link, router } from 'expo-router';
import { Gift, Lock, Mail, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { AuthSocialLogin } from '@/src/components/auth/AuthSocialLogin';
import { CommunityRulesCheckbox } from '@/src/components/auth/CommunityRulesCheckbox';
import { PrivacyConsentCheckbox } from '@/src/components/auth/PrivacyConsentCheckbox';
import { usePublicInvite } from '@/src/hooks/useInvites';
import { useAuthStore } from '@/src/stores/authStore';
import {
  clearPendingInviteCode,
  loadPendingInviteCode,
  savePendingInviteCode,
} from '@/src/stores/invite-storage';
import { getApiErrorCode, getApiErrorMessage } from '@/src/utils/api-error';
import {
  communityGuidelinesHref,
  privacyPolicyHref,
  verifyOtpHref,
} from '@/src/utils/auth-navigation';
import { isValidEmail, normalizeEmail } from '@/src/utils/email';
import { isCompleteInviteCode, normalizeInviteCode } from '@/src/utils/invite-code';

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
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyInvalid, setPrivacyInvalid] = useState(false);
  const [acceptedCommunityRules, setAcceptedCommunityRules] = useState(false);
  const [communityRulesInvalid, setCommunityRulesInvalid] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const publicInvite = usePublicInvite(isCompleteInviteCode(inviteCode) ? inviteCode : null);
  const inviteInvalid = isCompleteInviteCode(inviteCode) && publicInvite.data?.valid === false;

  useEffect(() => {
    void loadPendingInviteCode().then((code) => {
      if (code) {
        setInviteCode(normalizeInviteCode(code));
      }
    });
  }, []);

  function handleInviteCodeChange(value: string) {
    const code = normalizeInviteCode(value);
    setInviteCode(code);
    void (isCompleteInviteCode(code) ? savePendingInviteCode(code) : clearPendingInviteCode());
  }

  function clearFieldErrors() {
    setUsernameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setPrivacyInvalid(false);
    setCommunityRulesInvalid(false);
    setShowLoginHint(false);
  }

  function ensureConsents(): boolean {
    setPrivacyInvalid(!acceptedPrivacy);
    setCommunityRulesInvalid(!acceptedCommunityRules);
    return acceptedPrivacy && acceptedCommunityRules;
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
      setPrivacyInvalid(true);
    }

    if (!acceptedCommunityRules) {
      setCommunityRulesInvalid(true);
    }

    if (hasFieldError || !acceptedPrivacy || !acceptedCommunityRules) {
      if (hasFieldError) {
        setError(t('errors.VALIDATION_ERROR'));
      }
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
          <Text className="mb-3 text-center font-inter-semibold text-sm text-hive-primary">
            {t('invite.invitedBy', { username: publicInvite.data.ownerUsername })}
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
        <AuthInput
          autoCapitalize="characters"
          error={inviteInvalid ? t('errors.INVITE_EXPIRED') : undefined}
          icon={Gift}
          label={t('invite.codeFieldLabel')}
          placeholder={t('invite.codeFieldPlaceholder')}
          value={inviteCode}
          onChangeText={handleInviteCodeChange}
        />

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        {showLoginHint ? (
          <View className="items-center">
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link">
                <Text className="font-inter-bold text-sm text-hive-primary">
                  {t('auth.goToLogin')}
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        <PrivacyConsentCheckbox
          checked={acceptedPrivacy}
          invalid={privacyInvalid}
          onCheckedChange={(value) => {
            setAcceptedPrivacy(value);
            if (value) {
              setPrivacyInvalid(false);
            }
          }}
          onOpenPolicy={() => router.push(privacyPolicyHref())}
        />

        <CommunityRulesCheckbox
          checked={acceptedCommunityRules}
          invalid={communityRulesInvalid}
          onCheckedChange={(value) => {
            setAcceptedCommunityRules(value);
            if (value) {
              setCommunityRulesInvalid(false);
            }
          }}
          onOpenRules={() => router.push(communityGuidelinesHref())}
        />

        <AuthButton
          loading={loading}
          title={t('auth.createAccount')}
          onPress={() => void handleRegister()}
        />

        <AuthSocialLogin
          disabled={loading}
          onBeforeAuth={ensureConsents}
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
            <Text className="font-inter-bold text-sm text-hive-primary">{t('auth.login')}</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
