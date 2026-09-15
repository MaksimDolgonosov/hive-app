import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { showErrorToast } from '@/src/stores/toastStore';
import { canChangeAppIcon, type AppIconId } from '@/src/utils/app-icon';

type AppIconSelectProps = {
  className?: string;
};

const OPTIONS: { value: AppIconId; preview: number }[] = [
  { value: 'light', preview: require('../../../assets/images/icon-light.png') },
  { value: 'dark', preview: require('../../../assets/images/icon.png') },
];

export function AppIconSelect({ className }: AppIconSelectProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const appIcon = usePreferencesStore((state) => state.appIcon);
  const setAppIcon = usePreferencesStore((state) => state.setAppIcon);
  const [pending, setPending] = useState(false);
  const nativeSupported = canChangeAppIcon();

  async function handleSelect(icon: AppIconId) {
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
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('appIcon.label')}
      </Text>

      <View className="flex-row overflow-hidden rounded-hive-md border border-hive-stroke bg-hive-input-bg p-1">
        {OPTIONS.map((option) => {
          const isActive = appIcon === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: pending }}
              className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] ${
                isActive ? 'bg-hive-primary' : 'bg-transparent'
              }`}
              disabled={pending}
              onPress={() => void handleSelect(option.value)}
            >
              <Image
                contentFit="cover"
                source={option.preview}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: isActive ? theme.textOnAccent : theme.stroke,
                }}
              />
              <Text
                className={`font-inter text-[14px] font-semibold ${
                  isActive ? 'text-hive-on-accent' : 'text-hive-muted'
                }`}
              >
                {t(`appIcon.${option.value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-2 font-inter text-xs text-hive-muted">
        {nativeSupported ? t('appIcon.hint') : t('appIcon.unavailableMessage')}
      </Text>
    </View>
  );
}
