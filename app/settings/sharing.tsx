import { Ghost, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { SettingsToggleRow } from '@/src/components/profile/SettingsToggleRow';
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function SharingSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const echoLayerEnabled = usePreferencesStore((state) => state.echoLayerEnabled);
  const setEchoLayerEnabled = usePreferencesStore((state) => state.setEchoLayerEnabled);
  const privacy = usePrivacySettings();

  return (
    <ProfileCollectionLayout title={t('share.action')} onBack={() => goBackOrReplace('/settings')}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SettingsToggleRow
          icon={Ghost}
          label={t('growth.echoToggleLabel')}
          hint={t('growth.echoToggleHint')}
          value={echoLayerEnabled}
          onToggle={(next) => void setEchoLayerEnabled(next)}
        />
        <SettingsToggleRow
          icon={Ghost}
          label={t('growth.allowEchoLabel')}
          hint={t('growth.allowEchoHint')}
          value={privacy.settings.allowEcho}
          onToggle={(next) => privacy.update({ allowEcho: next })}
        />
        <SettingsToggleRow
          icon={Share2}
          label={t('share.allowSharingLabel')}
          hint={t('share.allowSharingHint')}
          value={privacy.settings.allowSharing}
          onToggle={(next) => privacy.update({ allowSharing: next })}
          showDivider={false}
        />
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
