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
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((state) => state.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);

    if (!username.trim() || !email.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(getApiErrorMessage(err, 'auth.registerFailed'));
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
          autoComplete="username"
          icon={User}
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          value={username}
          onChangeText={setUsername}
        />
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
          autoComplete="new-password"
          icon={Lock}
          label={t('common.password')}
          placeholder={t('common.passwordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text className="text-center font-inter text-sm text-red-500">{error}</Text>
        ) : null}

        <AuthButton loading={loading} title={t('auth.createAccount')} onPress={handleRegister} />
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
