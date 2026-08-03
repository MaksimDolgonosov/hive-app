import { FontAwesome } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Apple, Globe, Lock, Mail } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthFormCard } from '@/src/components/auth/AuthFormCard';
import { AuthInput } from '@/src/components/auth/AuthInput';
import { AuthLogo } from '@/src/components/auth/AuthLogo';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { useAuthStore } from '@/src/stores/authStore';
import { getApiErrorMessage } from '@/src/utils/api-error';

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.fillEmailPassword'));
      return;
    }

    setLoading(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace('/(tabs)');
    } catch (err) {
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
          value={password}
          onChangeText={setPassword}
        />

        <Pressable className="self-end">
          <Text className="font-inter text-[13px] font-semibold text-hive-primary">
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <AuthButton loading={loading} title={t('auth.login')} onPress={handleLogin} />

        <View className="items-center gap-3">
          <Text className="font-inter text-[13px] text-hive-muted">{t('auth.orLoginVia')}</Text>
          <View className="flex-row items-center justify-center gap-3">
            <SocialButton>
              <Apple color="#2C1810" size={22} strokeWidth={2} />
            </SocialButton>
            <SocialButton>
              <Globe color="#2C1810" size={22} strokeWidth={2} />
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
    </AuthScreenLayout>
  );
}
