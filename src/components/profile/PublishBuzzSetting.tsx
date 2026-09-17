import { Vibrate } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { SettingsToggleRow } from '@/src/components/profile/SettingsToggleRow';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export function PublishBuzzSetting() {
  const { t } = useTranslation();
  const publishBuzzEnabled = usePreferencesStore((state) => state.publishBuzzEnabled);
  const setPublishBuzzEnabled = usePreferencesStore((state) => state.setPublishBuzzEnabled);

  return (
    <SettingsToggleRow
      icon={Vibrate}
      label={t('profile.publishBuzzLabel')}
      hint={t('profile.publishBuzzHint')}
      value={publishBuzzEnabled}
      onToggle={(next) => void setPublishBuzzEnabled(next)}
    />
  );
}
