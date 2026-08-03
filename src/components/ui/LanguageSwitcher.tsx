import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppLanguage, SUPPORTED_LANGUAGES } from '@/src/i18n/languages';
import { useLocaleStore } from '@/src/stores/localeStore';

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);

  return (
    <View className={className}>
      <Text className="mb-2 text-center font-inter text-xs text-hive-muted">
        {t('language.label')}
      </Text>
      <View className="flex-row self-center overflow-hidden rounded-full border border-[#F5A62333] bg-hive-input-bg p-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = language === lang;

          return (
            <Pressable
              key={lang}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`rounded-full px-4 py-1.5 ${isActive ? 'bg-hive-primary' : 'bg-transparent'}`}
              onPress={() => void setLanguage(lang as AppLanguage)}
            >
              <Text
                className={`font-inter text-xs font-semibold uppercase ${
                  isActive ? 'text-white' : 'text-hive-muted'
                }`}
              >
                {lang}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
