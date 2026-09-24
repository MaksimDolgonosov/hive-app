import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { PrivacyPolicyDocument } from '@/src/components/legal/PrivacyPolicyDocument';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function PrivacyPolicyModalScreen() {
  const { t, i18n } = useTranslation();

  return (
    <ProfileCollectionLayout
      title={t('privacyPolicy.title')}
      onBack={() => goBackOrReplace('/(tabs)/profile')}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PrivacyPolicyDocument language={i18n.language} showTitle={false} />
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
