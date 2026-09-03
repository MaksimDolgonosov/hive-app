import { FontAwesome } from '@expo/vector-icons';
import { Link, router, type Href } from 'expo-router';
import { Apple, Lock, Mail } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { useAuthStore } from '@/src/stores/authStore';
import {
  getApiErrorCode,
  getApiErrorDetailString,
  getApiErrorMessage,
  logApiError,
} from '@/src/utils/api-error';
import { forgotPasswordHref, verifyOtpHref } from '@/src/utils/auth-navigation';
import { isValidEmail, normalizeEmail } from '@/src/utils/email';
import { parseOtpPurpose } from '@/src/utils/otp';

function SocialButton({ children }: { children: ReactNode }) {
  return (
    <View className="h-[52px] w-[52px] items-center justify-center rounded-full border border-[#F5A62333] bg-hive-input-bg">
      {children}
    </View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const setPendingOtp = useAuthStore((state) => state.setPendingOtp);
  const resetOnboarding = useAuthStore((state) => state.resetOnboarding);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openEmailVerification(
    pendingEmail: string,
    purpose: 'register' | 'password_reset',
  ) {
    setPendingOtp({ email: pendingEmail, purpose });

    try {
      await resendOtp({ email: pendingEmail, purpose });
    } catch (err) {
      logApiError('auth.loginResendOtp', err);
    }

    router.push(verifyOtpHref(pendingEmail, purpose));
  }

  async function handleLogin() {
    setError(null);

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      setError(t('auth.fillEmailPassword'));
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      await login({
        email: normalizedEmail,
        password,
      });
      router.replace('/(tabs)');
    } catch (err) {
      logApiError('auth.login', err);

      if (getApiErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
        const pendingEmail = normalizeEmail(
          getApiErrorDetailString(err, 'email') ?? normalizedEmail,
        );
        const purpose = parseOtpPurpose(getApiErrorDetailString(err, 'purpose')) ?? 'register';
        await openEmailVerification(pendingEmail, purpose);
        return;
      }

      setError(getApiErrorMessage(err, 'auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout>
      <AuthLogo subtitle={t('auth.loginSubtitle')} />

      <AuthFormCard title={t('auth.loginTitle')} subtitle={t('auth.loginCardSubtitle')}>
        <AuthInput
          autoCapitalize="none"
          autoComplete="email"
          icon={Mail}
          keyboardType="email-address"
          label={t('common.email')}
          placeholder={t('common.emailPlaceholder')}
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="password"
          icon={Lock}
          label={t('common.password')}
          placeholder={t('common.passwordPlaceholder')}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          accessibilityRole="link"
          className="self-end"
          onPress={() => {
            router.push(forgotPasswordHref(normalizeEmail(email) || undefined));
          }}
        >
          <Text className="font-inter text-[13px] font-semibold text-hive-primary">
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <AuthButton loading={loading} title={t('auth.login')} onPress={() => void handleLogin()} />

        <View className="items-center gap-3">
          <Text className="font-inter text-[13px] text-hive-muted">{t('auth.orLoginVia')}</Text>
          <View className="flex-row items-center justify-center gap-3">
            <SocialButton>
              <Apple color="#2C1810" size={22} strokeWidth={2} />
            </SocialButton>
            <SocialButton>
              <FontAwesome color="#2C1810" name="google" size={22} />
            </SocialButton>
            <SocialButton>
              <FontAwesome color="#2C1810" name="facebook" size={22} />
            </SocialButton>
          </View>
        </View>
      </AuthFormCard>

      <View className="mt-6 flex-row items-center justify-center gap-1">
        <Text className="font-inter text-sm text-hive-muted">{t('auth.noAccount')}</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable accessibilityRole="link">
            <Text className="font-inter text-sm font-bold text-hive-primary">
              {t('auth.register')}
            </Text>
          </Pressable>
        </Link>
      </View>

      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 items-center py-2"
          onPress={() => {
            void resetOnboarding().then(() => {
              router.replace('/(onboarding)/welcome' as Href);
            });
          }}
        >
          <Text className="font-inter text-xs text-hive-muted underline">
            Dev: показать онбординг
          </Text>
        </Pressable>
      ) : null}
    </AuthScreenLayout>
  );
}
