import { Vibrate } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export function PublishBuzzSetting() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const publishBuzzEnabled = usePreferencesStore((state) => state.publishBuzzEnabled);
  const setPublishBuzzEnabled = usePreferencesStore((state) => state.setPublishBuzzEnabled);

  function togglePublishBuzz() {
    void setPublishBuzzEnabled(!publishBuzzEnabled);
  }

  return (
    <ProfileMenuRow
      accessory={
        <Switch
          accessibilityLabel={t('profile.publishBuzzLabel')}
          ios_backgroundColor={theme.surface2}
          pointerEvents="none"
          thumbColor="#FFFFFF"
          trackColor={{ false: theme.surface2, true: theme.accent }}
          value={publishBuzzEnabled}
        />
      }
      icon={Vibrate}
      label={t('profile.publishBuzzLabel')}
      showChevron={false}
      onPress={togglePublishBuzz}
    />
  );
}
