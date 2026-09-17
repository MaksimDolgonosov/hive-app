import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeleteAccountSetting } from '@/src/components/profile/DeleteAccountSetting';
import { PrivacyPolicyLink } from '@/src/components/profile/PrivacyPolicyLink';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { PublishBuzzSetting } from '@/src/components/profile/PublishBuzzSetting';
import { SplashPreviewLink } from '@/src/components/profile/SplashPreviewLink';
import { AppIconSelect } from '@/src/components/ui/AppIconSelect';
import { LanguageSelect } from '@/src/components/ui/LanguageSelect';
import { ThemeSelect } from '@/src/components/ui/ThemeSelect';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ProfileCollectionLayout
      title={t('profile.menuSettings')}
      onBack={() => goBackOrReplace('/(tabs)/profile')}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LanguageSelect />
        <ThemeSelect />
        <AppIconSelect />
        <SplashPreviewLink onPress={() => router.push('/(modals)/splash' as Href)} />
        <PrivacyPolicyLink onPress={() => router.push('/(modals)/privacy-policy' as Href)} />
        <PublishBuzzSetting />
        <DeleteAccountSetting />
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
