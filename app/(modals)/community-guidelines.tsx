import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { CommunityGuidelinesDocument } from '@/src/components/legal/CommunityGuidelinesDocument';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function CommunityGuidelinesModalScreen() {
  const { t, i18n } = useTranslation();

  return (
    <ProfileCollectionLayout
      title={t('communityGuidelines.title')}
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
        <CommunityGuidelinesDocument language={i18n.language} showTitle={false} />
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
