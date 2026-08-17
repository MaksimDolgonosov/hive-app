import { Check, ChevronDown, Globe } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLanguage, SUPPORTED_LANGUAGES } from '@/src/i18n/languages';
import { useLocaleStore } from '@/src/stores/localeStore';

type LanguageSelectProps = {
  className?: string;
};

const LIST_MAX_HEIGHT = 320;

export function LanguageSelect({ className }: LanguageSelectProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  const listMaxHeight = Math.min(LIST_MAX_HEIGHT, windowHeight * 0.45);

  function handleSelect(lang: AppLanguage) {
    void setLanguage(lang);
    setOpen(false);
  }

  return (
    <>
      <View className={className}>
        <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
          {t('language.label')}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          className="h-12 flex-row items-center gap-2.5 rounded-hive-md border border-[#F5A62333] bg-hive-input-bg px-3.5"
          onPress={() => setOpen(true)}
        >
          <Globe color="#8B7355" size={18} strokeWidth={2} />
          <Text className="flex-1 font-inter text-[15px] text-hive-foreground">
            {t(`language.${language}`)}
          </Text>
          <ChevronDown color="#8B7355" size={18} strokeWidth={2} />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="rounded-t-[20px] bg-hive-bg px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-hive-primary/30" />
            <Text className="mb-3 text-center font-inter text-base font-semibold text-hive-foreground">
              {t('language.label')}
            </Text>

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item}
              style={{ maxHeight: listMaxHeight }}
              renderItem={({ item }) => {
                const isActive = language === item;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`flex-row items-center justify-between rounded-hive-md px-3 py-3.5 ${
                      isActive ? 'bg-hive-primary/10' : 'bg-transparent'
                    }`}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      className={`font-inter text-[15px] ${
                        isActive ? 'font-semibold text-hive-primary' : 'text-hive-foreground'
                      }`}
                    >
                      {t(`language.${item}`)}
                    </Text>
                    {isActive && <Check color="#F5A623" size={18} strokeWidth={2.5} />}
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
