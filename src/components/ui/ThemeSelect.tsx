import { Moon, Smartphone, Sun } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { SettingsChoiceSheet } from '@/src/components/ui/SettingsChoiceSheet';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import type { ThemePreference } from '@/src/theme/tokens';

type ThemeSelectProps = {
  className?: string;
};

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: 'system', icon: Smartphone },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeSelect({ className }: ThemeSelectProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const themePreference = usePreferencesStore((state) => state.themePreference);
  const setColorScheme = usePreferencesStore((state) => state.setColorScheme);
  const [open, setOpen] = useState(false);
  const ActiveIcon = OPTIONS.find((option) => option.value === themePreference)?.icon ?? Smartphone;

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

  function handleSelect(scheme: ThemePreference) {
    void setColorScheme(scheme);
    setOpen(false);
  }

  return (
    <View className={className}>
      <ProfileMenuRow
        badge={t(`theme.${themePreference}`)}
        icon={ActiveIcon}
        label={t('theme.label')}
        onPress={() => setOpen(true)}
      />
      <SettingsChoiceSheet
        options={options}
        selected={themePreference}
        title={t('theme.label')}
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </View>
  );
}
