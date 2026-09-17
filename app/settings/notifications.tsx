import { Bell, Radio } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { SettingsToggleRow } from '@/src/components/profile/SettingsToggleRow';
import { useNotificationSettings } from '@/src/hooks/useNotificationSettings';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const notifications = useNotificationSettings();

  return (
    <ProfileCollectionLayout
      title={t('push.settingsTitle')}
      onBack={() => goBackOrReplace('/settings')}
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
        <SettingsToggleRow
          icon={Bell}
          label={t('push.reactions')}
          hint={t('push.reactionsHint')}
          value={notifications.settings.reactions}
          onToggle={() => notifications.update({ reactions: !notifications.settings.reactions })}
        />
        <SettingsToggleRow
          icon={Radio}
          label={t('push.nearbyActivity')}
          hint={t('push.nearbyActivityHint')}
          value={notifications.settings.nearbyActivity}
          onToggle={() =>
            notifications.update({ nearbyActivity: !notifications.settings.nearbyActivity })
          }
        />
        <SettingsToggleRow
          icon={Bell}
          label={t('push.campaigns')}
          hint={t('push.campaignsHint')}
          value={notifications.settings.campaigns}
          onToggle={() => notifications.update({ campaigns: !notifications.settings.campaigns })}
        />
        <SettingsToggleRow
          icon={Bell}
          label={t('push.expiringSting')}
          hint={t('push.expiringStingHint')}
          value={notifications.settings.expiringSting}
          onToggle={() =>
            notifications.update({ expiringSting: !notifications.settings.expiringSting })
          }
        />
        <SettingsToggleRow
          icon={Bell}
          label={t('push.inviteAccepted')}
          hint={t('push.inviteAcceptedHint')}
          value={notifications.settings.inviteAccepted}
          onToggle={() =>
            notifications.update({ inviteAccepted: !notifications.settings.inviteAccepted })
          }
          showDivider={false}
        />
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
