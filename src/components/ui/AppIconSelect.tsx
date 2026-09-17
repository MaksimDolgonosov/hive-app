import { Image } from 'expo-image';
import { Smartphone } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { SettingsChoiceSheet } from '@/src/components/ui/SettingsChoiceSheet';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { showErrorToast } from '@/src/stores/toastStore';
import { type AppIconId } from '@/src/utils/app-icon';

type AppIconSelectProps = {
  className?: string;
};

const OPTIONS: { value: AppIconId; preview: number }[] = [
  { value: 'light', preview: require('../../../assets/images/icon-light.png') },
  { value: 'dark', preview: require('../../../assets/images/icon.png') },
];

export function AppIconSelect({ className }: AppIconSelectProps) {
  const { t } = useTranslation();
  const appIcon = usePreferencesStore((state) => state.appIcon);
  const setAppIcon = usePreferencesStore((state) => state.setAppIcon);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const options = useMemo(
    () =>
      OPTIONS.map((option) => ({
        value: option.value,
        label: t(`appIcon.${option.value}`),
        leading: (
          <Image
            contentFit="cover"
            source={option.preview}
            style={{ width: 28, height: 28, borderRadius: 7 }}
          />
        ),
      })),
    [t],
  );

  async function handleSelect(icon: AppIconId) {
    setOpen(false);

    if (pending || icon === appIcon) {
      return;
    }

    setPending(true);
    try {
      await setAppIcon(icon);
    } catch {
      showErrorToast({ message: t('appIcon.changeFailed') });
    } finally {
      setPending(false);
    }
  }

  return (
    <View className={className}>
      <ProfileMenuRow
        badge={t(`appIcon.${appIcon}`)}
        disabled={pending}
        icon={Smartphone}
        label={t('appIcon.label')}
        onPress={() => setOpen(true)}
      />
      <SettingsChoiceSheet
        options={options}
        selected={appIcon}
        title={t('appIcon.label')}
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={(value) => void handleSelect(value)}
      />
    </View>
  );
}
