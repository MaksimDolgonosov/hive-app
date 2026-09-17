import { Globe } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { SettingsChoiceSheet } from '@/src/components/ui/SettingsChoiceSheet';
import { AppLanguage, SUPPORTED_LANGUAGES } from '@/src/i18n/languages';
import { useLocaleStore } from '@/src/stores/localeStore';

type LanguageSelectProps = {
  className?: string;
};

export function LanguageSelect({ className }: LanguageSelectProps) {
  const { t } = useTranslation();
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((item) => ({
        value: item,
        label: t(`language.${item}`),
      })),
    [t],
  );

  function handleSelect(lang: AppLanguage) {
    void setLanguage(lang);
    setOpen(false);
  }

  return (
    <View className={className}>
      <ProfileMenuRow
        badge={t(`language.${language}`)}
        icon={Globe}
        label={t('language.label')}
        onPress={() => setOpen(true)}
      />
      <SettingsChoiceSheet
        options={options}
        selected={language}
        title={t('language.label')}
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </View>
  );
}
