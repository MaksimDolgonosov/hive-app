import { useTranslation } from 'react-i18next';

import { AuthBackButton } from '@/src/components/auth/AuthBackButton';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { CommunityGuidelinesDocument } from '@/src/components/legal/CommunityGuidelinesDocument';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function AuthCommunityGuidelinesScreen() {
  const { t, i18n } = useTranslation();

  return (
    <AuthScreenLayout>
      <AuthBackButton
        accessibilityLabel={t('auth.back')}
        onPress={() => goBackOrReplace('/(auth)/register')}
      />
      <CommunityGuidelinesDocument language={i18n.language} />
    </AuthScreenLayout>
  );
}
