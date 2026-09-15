import { useTranslation } from 'react-i18next';

import { AuthBackButton } from '@/src/components/auth/AuthBackButton';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { PrivacyPolicyDocument } from '@/src/components/legal/PrivacyPolicyDocument';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function AuthPrivacyPolicyScreen() {
  const { t, i18n } = useTranslation();

  return (
    <AuthScreenLayout>
      <AuthBackButton
        accessibilityLabel={t('auth.back')}
        onPress={() => goBackOrReplace('/(auth)/register')}
      />
      <PrivacyPolicyDocument language={i18n.language} />
    </AuthScreenLayout>
  );
}
