import { Moon, Sun } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { SettingsChoiceSheet } from '@/src/components/ui/SettingsChoiceSheet';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import type { AppColorScheme } from '@/src/theme/tokens';

type ThemeSelectProps = {
  className?: string;
};

const OPTIONS: { value: AppColorScheme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeSelect({ className }: ThemeSelectProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const colorScheme = usePreferencesStore((state) => state.colorScheme);
  const setColorScheme = usePreferencesStore((state) => state.setColorScheme);
  const [open, setOpen] = useState(false);
  const ActiveIcon = colorScheme === 'dark' ? Moon : Sun;

  const options = useMemo(
    () =>
      OPTIONS.map((option) => {
        const Icon = option.icon;
        return {
          value: option.value,
          label: t(`theme.${option.value}`),
          leading: <Icon color={theme.accent} size={18} strokeWidth={2} />,
        };
      }),
    [t, theme.accent],
  );

  function handleSelect(scheme: AppColorScheme) {
    void setColorScheme(scheme);
    setOpen(false);
  }

  return (
    <View className={className}>
      <ProfileMenuRow
        badge={t(`theme.${colorScheme}`)}
        icon={ActiveIcon}
        label={t('theme.label')}
        onPress={() => setOpen(true)}
      />
      <SettingsChoiceSheet
        options={options}
        selected={colorScheme}
        title={t('theme.label')}
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </View>
  );
}
